import dynamic from 'next/dynamic';
import { Lazy } from 'lazy-load-helper';
import { Mobile } from '@/mobile';

export default function Test() {
  return (
    <>
      <Lazy ssr>
        <Mobile>버튼</Mobile>
      </Lazy>
    </>
  );
}
