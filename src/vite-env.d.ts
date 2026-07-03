/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOLEMIO_TOKEN: string;
  readonly VITE_GOLEMIO_RANGE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
