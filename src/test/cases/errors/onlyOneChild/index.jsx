import { Lazy } from 'lazy-load';
import { Mobile } from '@/mobile';
import { Another } from '@/anohter';

export default function Test() {
  return (
    <>
      <Lazy>
        <Mobile>버튼</Mobile>
        <Another />
      </Lazy>
    </>
  );
}
