import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';

import packageJson from './package.json';

const external = (pkg) => {
  const externals = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.peerDependencies,
  });

  return externals.some((externalPkg) => {
    return pkg.startsWith(externalPkg);
  });
};

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

export default [
  {
    input: ['src/index.ts', 'src/plugin/index.ts'],
    external,
    output: [
      {
        dir: 'esm',
        format: 'es',
        entryFileNames: '[name].mjs',
        chunkFileNames: '[name]-[hash].mjs',
        preserveModules: true,
      },
      {
        dir: 'dist',
        format: 'cjs',
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        preserveModules: true,
      },
    ],
    plugins: [
      resolve({
        extensions,
      }),
      json(),
      commonjs(),
      babel({
        extensions,
        babelHelpers: 'runtime',
      }),
    ],
  },
];
