/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_AUTH0_DOMAIN: string
  readonly VITE_AUTH0_CLIENT_ID: string
  readonly VITE_AUTH0_AUDIENCE: string
  readonly VITE_ENABLE_AI_INSIGHTS: string
  readonly VITE_ENABLE_PREDICTIVE_ANALYTICS: string
  readonly VITE_ENABLE_REAL_TIME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}