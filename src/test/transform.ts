import * as babel from '@babel/core';

export function transform(code: string, plugins?: babel.PluginItem[]) {
  return babel
    .transform(code, {
      babelrc: false,
      configFile: './babel.config.jest.js',
      plugins,
      parserOpts: {
        plugins: ['jsx'],
      },
      sourceType: 'module',
      filename: '',
    })
    ?.code?.replaceAll(/"/g, "'")
    .trim();
}
