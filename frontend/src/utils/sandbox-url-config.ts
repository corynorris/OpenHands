/**
 * Module-level configuration for sandbox URL mapping.
 *
 * Populated from the backend's web-client config (`GET /api/v1/web-client/config`,
 * see `OptionService.getConfig`), which reflects:
 *   - OH_SANDBOX_CONTAINER_URL_PATTERN — how internal sandbox ports (8000, 8001,
 *     8011, 8012) map to externally reachable URLs, e.g.
 *     `https://openhands-{port}.example.com`. This pattern is the source of
 *     truth for sandbox URL rewriting: a service on internal port 8000 resolves
 *     to `https://openhands-8000.example.com` with NO port appended.
 *   - OH_WEB_URL — the public URL of this OpenHands instance, used as the
 *     canonical browser origin when the app is served behind a reverse proxy.
 */

let sandboxContainerUrlPattern: string | null = null;
let webUrl: string | null = null;

export interface SandboxUrlConfig {
  sandboxContainerUrlPattern?: string | null;
  webUrl?: string | null;
}

export function setSandboxUrlConfig(config: SandboxUrlConfig): void {
  sandboxContainerUrlPattern = config.sandboxContainerUrlPattern ?? null;
  webUrl = config.webUrl ?? null;
}

export function getSandboxContainerUrlPattern(): string | null {
  return sandboxContainerUrlPattern;
}

export function getWebUrl(): string | null {
  return webUrl;
}

export function isLocalhostHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * Whether a sandbox URL pattern maps sandbox ports to a reachable external
 * origin (i.e. it is not the default `http://localhost:{port}` fallback).
 *
 * The `{port}` placeholder is substituted with a throwaway value before
 * parsing so both pattern forms parse: `https://openhands-{port}.example.com`
 * and `https://example.com:{port}` (the latter would otherwise fail to parse
 * because `{port}` is not a valid port number).
 */
export function isUsableSandboxPattern(pattern: string | null): boolean {
  if (!pattern) return false;
  if (!pattern.includes("{port}")) return false;
  try {
    return !isLocalhostHostname(
      new URL(pattern.replace("{port}", "0")).hostname,
    );
  } catch {
    return false;
  }
}

export interface SandboxPatternOrigin {
  /** Host (optionally with port) from the substituted pattern. */
  host: string;
  /** Hostname (without port) from the substituted pattern. */
  hostname: string;
  /** Port from the substituted pattern, or "" when the pattern has none. */
  port: string;
  /** Scheme of the substituted pattern ("https" or "http"). */
  scheme: "https" | "http";
}

/**
 * Substitute `{port}` in the sandbox URL pattern and return the resulting
 * origin. Returns null when the pattern has no `{port}` placeholder or the
 * substituted URL is malformed.
 *
 * Examples:
 *   pattern "https://openhands-{port}.example.com", port "8000"
 *     -> { host: "openhands-8000.example.com", hostname: "openhands-8000.example.com",
 *          port: "", scheme: "https" }
 *   pattern "https://example.com:{port}", port "8000"
 *     -> { host: "example.com:8000", hostname: "example.com", port: "8000",
 *          scheme: "https" }
 */
export function applySandboxPattern(
  pattern: string,
  port: string,
): SandboxPatternOrigin | null {
  if (!pattern.includes("{port}")) return null;
  const substituted = pattern.replace("{port}", port);
  try {
    const url = new URL(substituted);
    return {
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      scheme: url.protocol === "https:" ? "https" : "http",
    };
  } catch {
    return null;
  }
}

/**
 * Canonical browser hostname for this instance: OH_WEB_URL when configured,
 * otherwise the current window's hostname.
 */
export function getBrowserHostname(): string {
  const url = getWebUrl();
  if (url) {
    try {
      return new URL(url).hostname;
    } catch {
      // fall through to window.location below
    }
  }
  return window.location.hostname ?? window.location.host?.split(":")[0];
}

/**
 * Canonical browser host (hostname + port) for this instance: OH_WEB_URL when
 * configured, otherwise the current window's host.
 */
export function getBrowserHost(): string {
  const url = getWebUrl();
  if (url) {
    try {
      return new URL(url).host;
    } catch {
      // fall through to window.location below
    }
  }
  return window.location.host;
}
