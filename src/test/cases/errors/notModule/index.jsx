import { Lazy } from 'lazy-load';

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
