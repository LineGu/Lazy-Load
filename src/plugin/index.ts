import type babel from '@babel/core';
import { PluginObj } from '@babel/core';

const NEXT_DYNAMIC_IMPORT_PATH = 'next/dynamic';

export default function plugin({ types: t }: typeof babel): PluginObj {
  return {
    name: 'babel-plugin-lazy-load-component',
    visitor: {
      Program(path) {
        /** If you are using a Lazy component, make sure to import Next Dynamic at the top. */
        let dynamicFunctionImported = false;

        path.traverse({
          ImportDeclaration(importPath) {
            const importSource = importPath.node.source.value;

            if (importSource === NEXT_DYNAMIC_IMPORT_PATH) {
              dynamicFunctionImported = true;
              return;
            }

            if (importSource === 'lazy-load-helper') {
              const hasLazyComponent = importPath.node.specifiers.some(
                ({ local }) => local.name === 'Lazy'
              );

              if (hasLazyComponent === false) {
                return;
              }

              if (dynamicFunctionImported === false) {
                const dynamicImport = t.importDeclaration(
                  [t.importDefaultSpecifier(t.identifier('dynamic'))],
                  t.stringLiteral(NEXT_DYNAMIC_IMPORT_PATH)
                );
                path.node.body.unshift(dynamicImport);
                dynamicFunctionImported = true;
              }
            }
          },
        });

        path.traverse({
          JSXElement(jsxPath) {
            const openingElement = jsxPath.node.openingElement;

            /** Only Lazy components need to be transpiled below. */
            if (
              !t.isJSXIdentifier(openingElement.name) ||
              openingElement.name.name !== 'Lazy'
            ) {
              return;
            }

            /** Check if SSR dynamic import handling is required. */
            const needSSRDynamicImport = openingElement.attributes.some(
              (attr) => {
                if (t.isJSXAttribute(attr) && attr.name.name === 'ssr') {
                  const isFalseValue =
                    t.isJSXExpressionContainer(attr.value) &&
                    t.isBooleanLiteral(attr.value.expression) &&
                    attr.value.expression.value === false;

                  return isFalseValue ? false : true;
                }
                return false;
              }
            );

            const childrenList: babel.types.JSXElement[] = [];

            jsxPath.node.children.forEach((child) => {
              if (t.isJSXFragment(child)) {
                throw new Error(
                  'A child of a Lazy component cannot be a Fragment.'
                );
              }

              if (t.isJSXElement(child)) {
                childrenList.push(child);
              } else if (t.isJSXExpressionContainer(child)) {
                if (t.isLogicalExpression(child.expression)) {
                  /** e.g. {visible && <Children />} */
                  if (t.isJSXElement(child.expression.right)) {
                    childrenList.push(child.expression.right);
                  }
                } else if (t.isConditionalExpression(child.expression)) {
                  if (t.isJSXElement(child.expression.consequent)) {
                    /** e.g. {visible ? <Children /> : null} */
                    childrenList.push(child.expression.consequent);
                  } else if (t.isJSXElement(child.expression.alternate)) {
                    /** e.g. {visible ? null : <Children />} */
                    childrenList.push(child.expression.alternate);
                  }
                }
              }
              return;
            });

            if (childrenList.length > 1) {
              throw new Error(
                'Children of a Lazy component are limited to a single child.'
              );
            }

            /** @TODO Allow multiple components if needed later. */
            const child = childrenList[0];

            if (
              child == null ||
              !t.isJSXElement(child) ||
              !(
                t.isJSXIdentifier(child.openingElement.name) ||
                t.isJSXMemberExpression(child.openingElement.name)
              )
            ) {
              throw new Error('Invalid child type.');
            }

            const childTagName = t.isJSXIdentifier(child.openingElement.name)
              ? child.openingElement.name.name
              : t.isJSXIdentifier(child.openingElement.name.object)
                ? child.openingElement.name.object.name
                : null;

            if (childTagName == null) {
              throw new Error('Unknown pattern for child name.');
            }

            /**
             * The logic for importing modules is declared separately and utilized in both the dynamic function and the prefetch of Lazy components.
             * If the path is passed as a variable and handled within the component, it may result in a "Critical dependency:
             * the request of a dependency is an expression" error, causing the module to not be found.
             *
             * */
            const importFunctionVar = `__${childTagName}_Fetcher`;

            /** Store the import path of the target to be Lazy Loaded. */
            let targetImportPath:
              | babel.NodePath<babel.types.ImportDeclaration>
              | undefined;

            path.traverse({
              ImportDeclaration(importPath) {
                importPath.node.specifiers.forEach((specifier) => {
                  if (specifier.local.name === childTagName) {
                    targetImportPath = importPath;
                  }
                });
              },
            });

            if (targetImportPath == null) {
              throw new Error(
                'The import path for the component to be lazy-loaded is missing.'
              );
            }

            const targetImportPathString = targetImportPath.node.source.value;
            const isNamedImport = targetImportPath.node.specifiers.some(
              (s) => t.isImportSpecifier(s) && s.local.name === childTagName
            );
            const isDefaultImport = targetImportPath.node.specifiers.some((s) =>
              t.isImportDefaultSpecifier(s)
            );

            if (isDefaultImport === false && isNamedImport === false) {
              throw new Error(
                'The import format for the component to be lazy-loaded is unknown.'
              );
            }

            /**
             * named import => import('path').then(({ ComponentName }) => ComponentName)
             * default import => import('path')
             */
            const importFunction = isNamedImport
              ? t.arrowFunctionExpression(
                  [],
                  t.callExpression(
                    t.memberExpression(
                      t.callExpression(t.identifier('import'), [
                        t.stringLiteral(targetImportPathString),
                      ]),
                      t.identifier('then')
                    ),
                    [
                      t.arrowFunctionExpression(
                        [
                          t.objectPattern([
                            t.objectProperty(
                              t.identifier(childTagName),
                              t.identifier(childTagName),
                              false,
                              true
                            ),
                          ]),
                        ],
                        t.identifier(childTagName)
                      ),
                    ]
                  )
                )
              : t.arrowFunctionExpression(
                  [],
                  t.callExpression(t.identifier('import'), [
                    t.stringLiteral(targetImportPathString),
                  ])
                );

            /**
             *
             * const ComponentName = dynamic(importFunction, { ssr: true })
             *
             */
            const dynamicImportStatement = t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier(childTagName),
                t.callExpression(t.identifier('dynamic'), [
                  t.identifier(importFunctionVar),
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier('ssr'),
                      t.booleanLiteral(needSSRDynamicImport)
                    ),
                  ]),
                ])
              ),
            ]);

            /** Remove the original import statements for components that have been processed with dynamic. */
            targetImportPath.node.specifiers =
              targetImportPath.node.specifiers.filter((s) =>
                isNamedImport
                  ? s.local.name !== childTagName
                  : t.isImportDefaultSpecifier(s) === false
              );

            /** If all components imported from a specific module have been replaced with dynamic, remove the corresponding import statement. */
            if (targetImportPath.node.specifiers.length === 0) {
              targetImportPath.remove();
            }

            const lastImportIndex = path.node.body.findLastIndex(
              (node) => node.type === 'ImportDeclaration'
            );

            /** Declare the module import function and dynamic import statement globally. */
            path.node.body.splice(
              lastImportIndex + 1,
              0,
              dynamicImportStatement
            );
            path.node.body.splice(
              lastImportIndex + 1,
              0,
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.identifier(importFunctionVar),
                  importFunction
                ),
              ])
            );

            /** Pass the module import function as an argument to the private _prefetchers of the Lazy Component. */
            openingElement.attributes.push(
              t.jsxAttribute(
                t.jsxIdentifier('_prefetchers'),
                t.jsxExpressionContainer(
                  t.arrayExpression([t.identifier(importFunctionVar)])
                )
              )
            );
          },
        });
      },
    },
  };
}
