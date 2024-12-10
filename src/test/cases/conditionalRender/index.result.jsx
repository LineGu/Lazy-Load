import dynamic from 'next/dynamic';
import { Lazy } from 'lazy-load';
import { useState } from 'react';

const __NewText_Fetcher = () => import('@/txt').then(({ NewText }) => NewText);
const NewText = dynamic(__NewText_Fetcher, {
  ssr: false,
});
const __Another_Fetcher = () =>
  import('@/new-mobile').then(({ Another }) => Another);
const Another = dynamic(__Another_Fetcher, {
  ssr: false,
});
const __DefaultComponent_Fetcher = () => import('@/new-mobile');
const DefaultComponent = dynamic(__DefaultComponent_Fetcher, {
  ssr: false,
});
const __Txt_Fetcher = () => import('@/txt').then(({ Txt }) => Txt);
const Txt = dynamic(__Txt_Fetcher, {
  ssr: false,
});
const __NewMobile_Fetcher = () =>
  import('@/new-mobile').then(({ NewMobile }) => NewMobile);
const NewMobile = dynamic(__NewMobile_Fetcher, {
  ssr: false,
});
const __Mobile_Fetcher = () => import('@/mobile').then(({ Mobile }) => Mobile);
const Mobile = dynamic(__Mobile_Fetcher, {
  ssr: false,
});

export default function Test() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Lazy _prefetchers={[__Mobile_Fetcher]}>
        {isVisible && <Mobile>버튼</Mobile>}
      </Lazy>
      <Lazy _prefetchers={[__NewMobile_Fetcher]}>
        {visible ? <NewMobile>버튼1</NewMobile> : null}
      </Lazy>
      <Lazy _prefetchers={[__Txt_Fetcher]}>
        {visible ? null : <Txt>버튼2</Txt>}
      </Lazy>
      {visible && (
        <Lazy _prefetchers={[__DefaultComponent_Fetcher]}>
          <DefaultComponent>버튼3</DefaultComponent>
        </Lazy>
      )}
      {visible ? (
        <Lazy _prefetchers={[__Another_Fetcher]}>
          <Another>버튼3</Another>
        </Lazy>
      ) : null}
      {visible ? null : (
        <Lazy _prefetchers={[__NewText_Fetcher]}>
          <NewText>버튼3</NewText>
        </Lazy>
      )}
    </>
  );
}
