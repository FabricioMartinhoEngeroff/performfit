/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAPIDAPI_KEY: string;
}

/** Admin fixo de desenvolvimento, injetado pelo vite.config só no `vite dev` (null no build). */
declare const __DEV_ADMIN__: { email: string; password: string } | null;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
