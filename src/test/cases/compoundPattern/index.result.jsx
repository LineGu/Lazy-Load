import dynamic from 'next/dynamic';
import { Lazy } from 'lazy-load';

const __Mobile_Fetcher = () => import('@/mobile').then(({ Mobile }) => Mobile);
const Mobile = dynamic(__Mobile_Fetcher, {
  ssr: true,
});

export default function Test() {
  return (
    <Lazy ssr _prefetchers={[__Mobile_Fetcher]}>
      <Mobile.Button>버튼</Mobile.Button>
    </Lazy>
  );
}
