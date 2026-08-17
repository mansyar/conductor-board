import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface StaticServeConfig {
  enabled: boolean;
  distDir: string;
  indexHtml: string | null;
}

/**
 * Resolves the static-serving decision for the compiled frontend.
 * Static serving is enabled only when the SPA entrypoint (`distDir/index.html`)
 * exists, so the dev loop (Vite + `/api` proxy) is unaffected by a missing build.
 */
export function staticServeConfig(distDir: string): StaticServeConfig {
  const indexHtml = join(distDir, 'index.html');
  const enabled = existsSync(indexHtml);
  return { enabled, distDir, indexHtml: enabled ? indexHtml : null };
}