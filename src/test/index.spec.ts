import fs from 'fs';

import { transform } from './transform';
import plugin from '../plugin';

const readTestCaseFile = (caseName: string) => ({
  origin: fs.readFileSync(`src/test/cases/${caseName}/index.jsx`, 'utf8'),
  result: fs.readFileSync(
    `src/test/cases/${caseName}/index.result.jsx`,
    'utf8'
  ),
});

const readErrorTestCaseFile = (caseName: string) => ({
  origin: fs.readFileSync(
    `src/test/cases/errors/${caseName}/index.jsx`,
    'utf8'
  ),
});

describe('lazy-load-component', () => {
  it('Performs basic operations without issues: creation of import functions, dynamic imports, and removal of import statements (named imports and default imports).', async () => {
    const { origin, result } = readTestCaseFile('basic');
    expect(transform(origin, [[plugin]])).toBe(transform(result));
  });

  it('Successfully handles dynamic processing even in conditional rendering environments.', async () => {
    const { origin, result } = readTestCaseFile('conditionalRender');
    expect(transform(origin, [[plugin]])).toBe(transform(result));
  });

  it('Successfully handles dynamic processing for children in compound patterns.', async () => {
    const { origin, result } = readTestCaseFile('compoundPattern');
    expect(transform(origin, [[plugin]])).toBe(transform(result));
  });

  it('Maintains the existing dynamic import if it is already applied.', async () => {
    const { origin, result } = readTestCaseFile('duplicate');
    expect(transform(origin, [[plugin]])).toBe(transform(result));
  });

  it('The children of Lazy are standard OpeningElement type children.', async () => {
    const { origin } = readErrorTestCaseFile('notOpeningElementChildPattern');
    expect(() => transform(origin, [[plugin]])).toThrowError(
      'Invalid child type.'
    );
  });

  it('The children of a Lazy component are a single child.', async () => {
    const { origin } = readErrorTestCaseFile('onlyOneChild');
    expect(() => transform(origin, [[plugin]])).toThrowError(
      'Children of a Lazy component are limited to a single child.'
    );
  });

  it('The children of a Lazy component are not a Fragment.', async () => {
    const { origin } = readErrorTestCaseFile('notFragment');
    expect(() => transform(origin, [[plugin]])).toThrowError(
      'A child of a Lazy component cannot be a Fragment.'
    );
  });

  it('Only components imported as a Module can be used with Lazy.', async () => {
    const { origin } = readErrorTestCaseFile('notModule');
    expect(() => transform(origin, [[plugin]])).toThrowError(
      'The import path for the component to be lazy-loaded is missing.'
    );
  });
});
