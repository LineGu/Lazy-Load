import { Lazy } from 'lazy-load';
import { Mobile } from '@/mobile';
import DefaultComponent, { NewMobile, Another } from '@/new-mobile';
import { Txt } from '@/txt';
import { Toggle } from '../../Components/Toggle';
import { Wrapper } from 'Components/Toggle';

export default function Test() {
  return (
    <>
      <Lazy ssr>
        <Mobile>버튼</Mobile>
      </Lazy>
      <Lazy ssr={true}>
        <NewMobile>버튼2</NewMobile>
      </Lazy>
      <Lazy ssr={true} prefetchOnMount>
        <Txt>테스트 텍스트</Txt>
      </Lazy>
      <Another />
      <Lazy>
        <DefaultComponent />
      </Lazy>
      <Lazy>
        <Toggle />
      </Lazy>
      <Lazy>
        <Wrapper>
          <Toggle />
        </Wrapper>
      </Lazy>
      <Toggle />
    </>
  );
}
