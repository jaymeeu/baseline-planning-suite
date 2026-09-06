declare module 'people/App' {
  import type { ComponentType } from 'react';
  import type { HostContext } from '@bps/contracts';

  export const App: ComponentType<{ host?: HostContext }>;
  const Default: ComponentType<{ host?: HostContext }>;
  export default Default;
}

declare module 'delivery/App' {
  import type { ComponentType } from 'react';
  import type { HostContext } from '@bps/contracts';

  export const App: ComponentType<{ host?: HostContext }>;
  const Default: ComponentType<{ host?: HostContext }>;
  export default Default;
}
