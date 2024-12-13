import dynamic from 'next/dynamic';
import { Lazy } from 'lazy-load-helper';

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
    </>
  );
}
