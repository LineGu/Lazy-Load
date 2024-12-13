import { Lazy } from 'lazy-load-helper';
import { Mobile } from '@/mobile';

const COMPONENT_MAP = {
  Mobile: Mobile,
};

export default function Test() {
  return (
    <>
      <Lazy>{COMPONENT_MAP.Mobile}</Lazy>
    </>
  );
}
