# Lazy Load

Lazy Load is a lightweight library that makes it easier to implement dynamic loading in Next.js without manually dealing with `next/dynamic`. It allows you to wrap your components with a simple `<Lazy>` component and automatically apply dynamic imports, server-side rendering (SSR), and prefetching.

## Features

- **Automatic Dynamic Import**: Wrap any component with the `<Lazy>` component and it will automatically use Next.js's dynamic import functionality.
- **SSR Support**: Supports Server-Side Rendering (SSR) out of the box.
- **Prefetching**: Prefetch modules either on mount or at a specified point in your app for improved performance.
- **Simple API**: You can write code as you normally would, and Lazy Load will handle the rest.
- **IDE Autocompletion**: Since it uses standard JavaScript imports, IDE autocompletion works seamlessly with Lazy Load.
- **Default & Named Exports**: No need to worry about whether a module is a default export or a named export—Lazy Load handles both cases automatically.
- **Performance**: Lazy loading and prefetching help improve your app’s performance by loading only what’s necessary when it's needed.

## Installation

```bash
npm install lazy-load-next
# or
yarn add lazy-load-next
```

## Usage

### Basic Example

Instead of manually handling dynamic imports with `next/dynamic`, you can simply use the `<Lazy>` component to wrap any child component you want to load lazily.

```jsx
import { Lazy } from 'lazy-load-helper';
import { Component } from '@/module';

<Lazy ssr prefetchOnMount>
  <Component />
</Lazy>;
```

You can use the configuration like the example below by adding the plugin to the Babel config:

```json
{
  presets: [
    require.resolve('@babel/preset-env'),
    require.resolve('next/babel'),
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
      },
    ],
  ],
  plugins: [require.resolve('babel-plugin-macros')],
}
```

### What Happens Behind the Scenes

When you wrap a component with <Lazy>, it gets automatically transformed into the following dynamic import:

```jsx
import dynamic from 'next/dynamic';

const Wrapper = dynamic(
  () => import('@/module').then(({ Component }) => Component),
  {
    ssr: true,
  }
);
```

This transformation happens at build time, so you don’t have to manually write out the dynamic import code.

### Prefetching

You can also control when modules are pre-fetched. For example, you can enable prefetching when the component is mounted by using the prefetchOnMount prop.

```jsx
const handleClick = () => {
  // manual
  lazyController.current.prefetch();
  setVisible(true);
};

<Lazy prefetchOnMount ref={lazyController}>
  {visible && <Component />}
</Lazy>;
```

This ensures that the component and its dependencies are preloaded when the Lazy Component mounts, improving load time when it's actually needed.

### Default & Named Exports

Whether your component is exported as a default export or a named export, you don’t need to worry about it. Lazy Load automatically handles both cases without any additional configuration.

```jsx
// For default exports
export default function Component() { ... }
// For named exports
export function Component() { ... }
```

Lazy Load will handle both types seamlessly.

### Benefits

- _Simplicity_: With Lazy Load, you don’t need to manually set up dynamic imports or configure SSR. It just works by wrapping your components with the <Lazy> tag.
- _Performance Boost_: Automatically improves the performance of your Next.js application by loading components lazily, reducing initial load time.
- _Ease of Use_: Continue using standard imports and enjoy the benefits of lazy loading and prefetching without additional configuration.
- _No More Boilerplate_: Say goodbye to writing out repetitive dynamic import logic for each component. Lazy Load abstracts that complexity for you.
