import { Lazy } from 'lazy-load-helper';
import { Mobile } from '@/mobile';

export default function Test() {
  return (
    <>
      <Lazy>
        <>
          <Mobile>버튼</Mobile>
        </>
      </Lazy>
    </>
  );
}
