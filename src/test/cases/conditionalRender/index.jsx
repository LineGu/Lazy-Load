import { Lazy } from 'lazy-load';
import { Mobile } from '@/mobile';
import DefaultComponent, { NewMobile, Another } from '@/new-mobile';
import { Txt, NewText } from '@/txt';
import { useState } from 'react';

export default function Test() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Lazy>{isVisible && <Mobile>버튼</Mobile>}</Lazy>
      <Lazy>{visible ? <NewMobile>버튼1</NewMobile> : null}</Lazy>
      <Lazy>{visible ? null : <Txt>버튼2</Txt>}</Lazy>
      {visible && (
        <Lazy>
          <DefaultComponent>버튼3</DefaultComponent>
        </Lazy>
      )}
      {visible ? (
        <Lazy>
          <Another>버튼3</Another>
        </Lazy>
      ) : null}
      {visible ? null : (
        <Lazy>
          <NewText>버튼3</NewText>
        </Lazy>
      )}
    </>
  );
}
