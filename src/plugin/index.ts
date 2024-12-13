import type babel from '@babel/core';
import { PluginObj } from '@babel/core';

const NEXT_DYNAMIC_IMPORT_PATH = 'next/dynamic';

export default function plugin({ types: t }: typeof babel): PluginObj {
  return {
    name: 'babel-plugin-lazy-load-component',
    visitor: {
      Program(path) {
        /** Lazy 컴포넌트를 사용하고 있다면, Next Dynamic을 상단에서 import 해옵니다 */
        let dynamicFunctionImported = false;

        path.traverse({
          ImportDeclaration(importPath) {
            const importSource = importPath.node.source.value;

            if (importSource === NEXT_DYNAMIC_IMPORT_PATH) {
              dynamicFunctionImported = true;
              return;
            }

            if (importSource === 'lazy-load') {
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

            /** 이하 Lazy 컴포넌트만 트랜스파일 필요 */
            if (
              !t.isJSXIdentifier(openingElement.name) ||
              openingElement.name.name !== 'Lazy'
            ) {
              return;
            }

            /** ssr dynamic import 처리가 필요한지 체크 */
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
                  'Lazy 컴포넌트의 자식은 Fragment가 될 수 없습니다.'
                );
              }

              if (t.isJSXElement(child)) {
                /** 일반 Child */
                childrenList.push(child);
              } else if (t.isJSXExpressionContainer(child)) {
                if (t.isLogicalExpression(child.expression)) {
                  /** 내부 조건 분기 처리. e.g. {visible && <Children />} */
                  if (t.isJSXElement(child.expression.right)) {
                    childrenList.push(child.expression.right);
                  }
                } else if (t.isConditionalExpression(child.expression)) {
                  if (t.isJSXElement(child.expression.consequent)) {
                    /** 내부 3항 연산자 처리. e.g. {visible ? <Children /> : null} */
                    childrenList.push(child.expression.consequent);
                  } else if (t.isJSXElement(child.expression.alternate)) {
                    /** 내부 3항 연산자 처리. e.g. {visible ? null : <Children />} */
                    childrenList.push(child.expression.alternate);
                  }
                }
              }
              return;
            });

            if (childrenList.length > 1) {
              throw new Error(
                'Lazy 컴포넌트의 Children은 단일 자식만 허용됩니다.'
              );
            }

            /** @TODO 이후 필요하면 복수개의 컴포넌트도 허용합니다 */
            const child = childrenList[0];

            if (
              child == null ||
              !t.isJSXElement(child) ||
              !(
                t.isJSXIdentifier(child.openingElement.name) ||
                t.isJSXMemberExpression(child.openingElement.name)
              )
            ) {
              throw new Error('유효하지 않은 자식 형식입니다.');
            }

            const childTagName = t.isJSXIdentifier(child.openingElement.name)
              ? child.openingElement.name.name
              : t.isJSXIdentifier(child.openingElement.name.object)
                ? child.openingElement.name.object.name
                : null;

            if (childTagName == null) {
              throw new Error('자식 이름을 알 수 없는 패턴입니다.');
            }

            /**
             * 모듈을 import 하는 로직은 별도로 선언하여, dynamic 함수와 Lazy 컴포넌트의 prefetch에서 함께 활용합니다.
             * Path를 변수로 받아 컴포넌트 내부에서 처리하게 되면,
             * Critical dependency: the request of a dependency is an expression 에러와 함께, 모듈을 찾지 못하는 경우가 발생합니다.
             *
             * */
            const importFunctionVar = `__${childTagName}_Fetcher`;

            /** Lazy Load 처리할 대상의 import 경로 저장 */
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
                'Lazy Load할 컴포넌트의 import 경로값이 없습니다.'
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
                'Lazy Load할 컴포넌트의 import 형태를 알 수 없습니다'
              );
            }

            /**
             * named import의 경우 import('path').then(({ ComponentName }) => ComponentName)
             * default import의 경우 import('path')
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
             * dynamic import 로직을 작성합니다.
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

            /** dynamic 처리가 된 컴포넌트들을 원래의 import 구문에서 삭제해줍니다. */
            targetImportPath.node.specifiers =
              targetImportPath.node.specifiers.filter((s) =>
                isNamedImport
                  ? s.local.name !== childTagName
                  : t.isImportDefaultSpecifier(s) === false
              );

            /** 특정 모듈에서 import하는 컴포넌트가 모두 dynamic으로 대체 되었다면, 해당 import 구문을 삭제합니다. */
            if (targetImportPath.node.specifiers.length === 0) {
              targetImportPath.remove();
            }

            const lastImportIndex = path.node.body.findLastIndex(
              (node) => node.type === 'ImportDeclaration'
            );

            /** 모듈  import 함수와, dynamic import 구문을 전역에 선언합니다 */
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

            /** 모듈 import 함수를 Lazy Component의 private _prefetchers 인자로 넘겨줍니다. */
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
