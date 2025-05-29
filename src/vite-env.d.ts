/// <reference types="vite/client" />

interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_DB_NAME: string
  readonly VITE_DB_VERSION: number
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}