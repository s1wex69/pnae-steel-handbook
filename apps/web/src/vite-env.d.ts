/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EMBED_GUARD?: string;
  readonly VITE_EMBED_ALLOWED_HOSTS?: string;
  readonly VITE_EMBED_SITE_URL?: string;
  readonly VITE_EMBED_SITE_NAME?: string;
  readonly VITE_HANDBOOK_DATA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
