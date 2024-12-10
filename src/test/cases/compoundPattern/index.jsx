import { Lazy } from 'lazy-load';
import { Mobile } from '@/mobile';

export default function Test() {
  return (
    <Lazy ssr>
      <Mobile.Button>버튼</Mobile.Button>
    </Lazy>
  );
}
