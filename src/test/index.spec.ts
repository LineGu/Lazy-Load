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
  it('기본적인 동작을 문제 없이 수행한다. import function, dynamic import 생성 및 import 구문 제거 (named import, default import)', async () => {
    const { origin, result } = readTestCaseFile('basic');
    expect(transform(origin, [[plugin]])).toBe(transform(result));
  });

  it('조건부 렌더링 환경에서도 dynamic 처리에 성공한다.', async () => {
    const { origin, result } = readTestCaseFile('conditionalRender');
    expect(transform(origin, [[plugin]])).toBe(transform(result));
  });

  it('컴파운트 패턴의 자식도 dynamic 처리에 성공한다.', async () => {
    const { origin, result } = readTestCaseFile('compoundPattern');
    expect(transform(origin, [[plugin]])).toBe(transform(result));
  });

  it('이미 dynamic이 import된 경우 유지한다', async () => {
    const { origin, result } = readTestCaseFile('duplicate');
    expect(transform(origin, [[plugin]])).toBe(transform(result));
  });

  it('Lazy의 자식은 일반적인 OpeningElement 형식의 Children이다.', async () => {
    const { origin } = readErrorTestCaseFile('notOpeningElementChildPattern');
    expect(() => transform(origin, [[plugin]])).toThrowError(
      '유효하지 않은 자식 형식입니다.'
    );
  });

  it('Lazy 컴포넌트의 Children은 단일 자식이다.', async () => {
    const { origin } = readErrorTestCaseFile('onlyOneChild');
    expect(() => transform(origin, [[plugin]])).toThrowError(
      'Lazy 컴포넌트의 Children은 단일 자식만 허용됩니다.'
    );
  });

  it('Lazy 컴포넌트의 Children는 Fragment가 아니다', async () => {
    const { origin } = readErrorTestCaseFile('notFragment');
    expect(() => transform(origin, [[plugin]])).toThrowError(
      'Lazy 컴포넌트의 자식은 Fragment가 될 수 없습니다.'
    );
  });

  it('Module로 불러온 컴포넌트만 Lazy가 가능하다', async () => {
    const { origin } = readErrorTestCaseFile('notModule');
    expect(() => transform(origin, [[plugin]])).toThrowError(
      'Lazy Load할 컴포넌트의 import 경로값이 없습니다.'
    );
  });
});
