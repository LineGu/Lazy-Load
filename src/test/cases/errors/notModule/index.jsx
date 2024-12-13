import { Lazy } from 'lazy-load-helper';

export default function Test() {
  return (
    <>
      <Lazy>
        <MobileButton />
      </Lazy>
    </>
  );
}

function MobileButton() {
  return <Mobile>버튼</Mobile>;
}
