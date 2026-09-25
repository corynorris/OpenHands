import {
  applySandboxPattern,
  getBrowserHost,
  getBrowserHostname,
  getSandboxContainerUrlPattern,
  isLocalhostHostname,
  isUsableSandboxPattern,
} from "./sandbox-url-config";

interface SandboxBase {
  host: string;
  /**
   * Scheme of the sandbox URL pattern when the base host was derived from
   * OH_SANDBOX_CONTAINER_URL_PATTERN (https/http), otherwise null. When set,
   * callers must derive the protocol from this scheme (https -> wss) rather
   * than from the browser's location, because the sandbox origin may differ
   * from the page origin.
   */
  patternScheme: "https" | "http" | null;
}

/**
 * Resolves the base host (and, when applicable, the scheme) for sandbox URLs.
 *
 * The conversation URL (e.g. `http://localhost:8000/api/conversations/123`) is
 * the internal address of the sandbox's agent-server. When
 * OH_SANDBOX_CONTAINER_URL_PATTERN is configured to a non-localhost origin,
 * the internal port (8000) is substituted into the pattern and the pattern's
 * scheme drives protocol selection — the external URL is
 * `https://openhands-8000.example.com/...` with NO port appended to the public
 * hostname. Without a pattern, the legacy behavior is preserved: localhost is
 * rewritten to the browser's hostname with the internal port kept (used when
 * sandbox ports are published directly on the OpenHands host).
 */
function resolveSandboxBase(
  conversationUrl: string | null | undefined,
): SandboxBase {
  if (conversationUrl && !conversationUrl.startsWith("/")) {
    try {
      const url = new URL(conversationUrl);
      const urlHostname = url.hostname;
      const pattern = getSandboxContainerUrlPattern();

      // Pattern-configured deployments: map internal sandbox ports to the
      // externally reachable host from the pattern.
      if (
        isLocalhostHostname(urlHostname) &&
        isUsableSandboxPattern(pattern) &&
        url.port
      ) {
        const mapped = applySandboxPattern(pattern as string, url.port);
        if (mapped) {
          return { host: mapped.host, patternScheme: mapped.scheme };
        }
      }

      // Legacy behavior: localhost -> browser hostname, keeping the port.
      const browserHostname = getBrowserHostname();
      if (
        browserHostname &&
        isLocalhostHostname(urlHostname) &&
        !isLocalhostHostname(browserHostname)
      ) {
        return { host: `${browserHostname}:${url.port}`, patternScheme: null };
      }
      return { host: url.host, patternScheme: null };
    } catch {
      return { host: getBrowserHost(), patternScheme: null };
    }
  }
  return { host: getBrowserHost(), patternScheme: null };
}

/**
 * Extracts the base host from conversation URL
 * @param conversationUrl The conversation URL containing host/port (e.g., "http://localhost:3000/api/conversations/123")
 * @returns Base host (e.g., "localhost:3000") or window.location.host as fallback
 */
export function extractBaseHost(
  conversationUrl: string | null | undefined,
): string {
  return resolveSandboxBase(conversationUrl).host;
}

/**
 * Extracts the path prefix from conversation URL (everything before /api/conversations)
 * This is needed for proxy deployments where agent-servers are accessed via paths like /runtime/{port}/
 * @param conversationUrl The conversation URL (e.g., "http://localhost:3000/runtime/55313/api/conversations/123")
 * @returns Path prefix without trailing slash (e.g., "/runtime/55313") or empty string
 */
export function extractPathPrefix(
  conversationUrl: string | null | undefined,
): string {
  if (!conversationUrl || conversationUrl.startsWith("/")) return "";
  try {
    const { pathname } = new URL(conversationUrl);
    // The SDK serves both LLM and ACP conversations on the unified
    // ``/api/conversations`` route, so a single regex anchored at a segment
    // boundary is enough. ``$|/`` stops at the ``/{id}`` segment that
    // follows so a path that merely *contains* ``/api/conversations`` as a
    // substring of some unrelated segment is not misclassified.
    const match = pathname.match(/^(.*?)\/api\/conversations(?:\/|$)/);
    const prefix = match ? match[1] : "";
    return prefix.replace(/\/$/, "");
  } catch {
    return "";
  }
}

function httpProtocolFor(
  patternScheme: "https" | "http" | null,
): "https:" | "http:" {
  if (patternScheme) {
    return patternScheme === "https" ? "https:" : "http:";
  }
  return window.location.protocol === "https:" ? "https:" : "http:";
}

function wsProtocolFor(patternScheme: "https" | "http" | null): "wss:" | "ws:" {
  if (patternScheme) {
    return patternScheme === "https" ? "wss:" : "ws:";
  }
  return window.location.protocol === "https:" ? "wss:" : "ws:";
}

/**
 * Builds the HTTP base URL for V1 API calls
 * @param conversationUrl The conversation URL containing host/port
 * @returns HTTP base URL (e.g., "http://localhost:3000" or "http://localhost:3000/runtime/55313")
 */
export function buildHttpBaseUrl(
  conversationUrl: string | null | undefined,
): string {
  const { host, patternScheme } = resolveSandboxBase(conversationUrl);
  const pathPrefix = extractPathPrefix(conversationUrl);
  const protocol = httpProtocolFor(patternScheme);
  return `${protocol}//${host}${pathPrefix}`;
}

/**
 * Builds the WebSocket URL for V1 conversations (without query params)
 * @param conversationId The conversation ID
 * @param conversationUrl The conversation URL containing host/port (e.g., "http://localhost:3000/api/conversations/123")
 * @returns WebSocket URL or null if inputs are invalid
 */
export function buildWebSocketUrl(
  conversationId: string | undefined,
  conversationUrl: string | null | undefined,
): string | null {
  if (!conversationId) {
    return null;
  }

  const { host, patternScheme } = resolveSandboxBase(conversationUrl);
  const pathPrefix = extractPathPrefix(conversationUrl);

  // Build WebSocket URL: ws://host:port[/path-prefix]/sockets/events/{conversationId}
  // The path prefix (e.g., /runtime/55313) is needed for proxy deployments
  // Note: Query params should be passed via the useWebSocket hook options
  //
  // When the base host comes from the sandbox URL pattern, the protocol must
  // follow the pattern's scheme (https -> wss, http -> ws) because the sandbox
  // origin may be a different hostname than the page.
  const protocol = wsProtocolFor(patternScheme);

  return `${protocol}//${host}${pathPrefix}/sockets/events/${conversationId}`;
}
