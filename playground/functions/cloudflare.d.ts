// Generated by vite-plugin-cloudflare-functions

/// <reference types="@cloudflare/workers-types" />
/// <reference types="vite-plugin-cloudflare-functions/types" />

import 'vite-plugin-cloudflare-functions/worker';

declare module 'vite-plugin-cloudflare-functions/worker' {
  interface PagesFunctionEnv {
    STORE: KVNamespace;

    USER: string;
  }

  interface PagesFunctionData {}
}
