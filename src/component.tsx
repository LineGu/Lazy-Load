import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

const IS_DEV = process.env.NODE_ENV !== 'production';

interface Props {
  children: React.ReactNode;
  ssr?: true;
  prefetchOnMount?: boolean;
  _prefetchers?: Array<() => Promise<any>>;
}

export interface ImperativeHandler {
  prefetch: () => Promise<void>;
}

/**
 * Lazy Load를 위한 컴포넌트입니다.
 * "lazy-load/plugin" 바벨 플러그인과 함께 사용해야 합니다.
 *
 * @param ssr 서버사이드에서 동적 import가 동작하도록 처리할 것인지에 대한 옵션.
 * default false로 true만 받도록 허용합니다. @default false
 *
 * @param prefetchOnMount Lazy 컴포넌트가 마운트 됐을 때, 동적 모듈을 prefetch 할지에 대한 boolean @default true
 */
export const Lazy = forwardRef<ImperativeHandler, Props>(function Lazy(
  { children, prefetchOnMount = true, _prefetchers },
  ref
) {
  const prefetchersRef = useRef(_prefetchers);
  prefetchersRef.current = _prefetchers;

  const prefetch = useCallback(async () => {
    if (prefetchersRef.current == null) {
      if (IS_DEV) {
        throw new Error(
          'import prefetcher가 없습니다. 플러그인 확인이 필요합니다'
        );
      }
      return;
    }

    await Promise.allSettled([
      prefetchersRef.current?.map((fetcher) => fetcher()),
    ]);
    return;
  }, []);

  useImperativeHandle(ref, () => ({ prefetch }));

  useEffect(() => {
    if (prefetchOnMount) {
      prefetch();
    }
  }, [prefetchOnMount, prefetch]);

  return <>{children}</>;
});
