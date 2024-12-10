import dynamic from 'next/dynamic';
import { Lazy } from 'lazy-load';
import { Another } from '@/new-mobile';

const __Wrapper_Fetcher = () =>
  import('Components/Toggle').then(({ Wrapper }) => Wrapper);
const Wrapper = dynamic(__Wrapper_Fetcher, {
  ssr: false,
});
const __Toggle_Fetcher = () =>
  import('../../Components/Toggle').then(({ Toggle }) => Toggle);
const Toggle = dynamic(__Toggle_Fetcher, {
  ssr: false,
});
const __DefaultComponent_Fetcher = () => import('@/new-mobile');
const DefaultComponent = dynamic(__DefaultComponent_Fetcher, {
  ssr: false,
});
const __Txt_Fetcher = () => import('@/txt').then(({ Txt }) => Txt);
const Txt = dynamic(__Txt_Fetcher, {
  ssr: true,
});
const __NewMobile_Fetcher = () =>
  import('@/new-mobile').then(({ NewMobile }) => NewMobile);
const NewMobile = dynamic(__NewMobile_Fetcher, {
  ssr: true,
});
const __Mobile_Fetcher = () => import('@/mobile').then(({ Mobile }) => Mobile);
const Mobile = dynamic(__Mobile_Fetcher, {
  ssr: true,
});

export default function Test() {
  return (
    <>
      <Lazy ssr _prefetchers={[__Mobile_Fetcher]}>
        <Mobile>버튼</Mobile>
      </Lazy>
      <Lazy ssr={true} _prefetchers={[__NewMobile_Fetcher]}>
        <NewMobile>버튼2</NewMobile>
      </Lazy>
      <Lazy ssr={true} prefetchOnMount _prefetchers={[__Txt_Fetcher]}>
        <Txt>테스트 텍스트</Txt>
      </Lazy>
      <Another />
      <Lazy _prefetchers={[__DefaultComponent_Fetcher]}>
        <DefaultComponent />
      </Lazy>
      <Lazy _prefetchers={[__Toggle_Fetcher]}>
        <Toggle />
      </Lazy>
      <Lazy _prefetchers={[__Wrapper_Fetcher]}>
        <Wrapper>
          <Toggle />
        </Wrapper>
      </Lazy>
      <Toggle />
    </>
  );
}
