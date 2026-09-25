import {
  applySandboxPattern,
  getBrowserHostname,
  getSandboxContainerUrlPattern,
  isLocalhostHostname,
  isUsableSandboxPattern,
} from "./sandbox-url-config";

/**
 * Helper function to transform VS Code URLs
 *
 * When OH_SANDBOX_CONTAINER_URL_PATTERN is configured to a non-localhost
 * origin, a VS Code URL pointing at the sandbox's internal port
 * (e.g. `http://localhost:8001/?tkn=...&folder=/workspace`) is rewritten so
 * the port is substituted into the pattern — `https://openhands-8001.example.com/?tkn=...`
 * — with no port appended to the public hostname.
 *
 * Without a pattern, the legacy behavior is preserved: a localhost URL is
 * rewritten to the current window's hostname, keeping the port (used when
 * sandbox ports are published directly on the OpenHands host).
 *
 * @param vsCodeUrl The original VS Code URL from the backend
 * @returns The transformed URL with the correct hostname
 */
export function transformVSCodeUrl(vsCodeUrl: string | null): string | null {
  if (!vsCodeUrl) return null;

  try {
    const url = new URL(vsCodeUrl);
    const pattern = getSandboxContainerUrlPattern();

    // Pattern-configured deployments: map the internal sandbox port to the
    // externally reachable origin, preserving path, query and fragment.
    if (
      isLocalhostHostname(url.hostname) &&
      isUsableSandboxPattern(pattern) &&
      url.port
    ) {
      const mapped = applySandboxPattern(pattern as string, url.port);
      if (mapped) {
        // Rebuild origin from the pattern. Assign hostname/port separately:
        // assigning `url.host` keeps the old port when the value has none.
        url.protocol = mapped.scheme === "https" ? "https:" : "http:";
        url.hostname = mapped.hostname;
        url.port = mapped.port;
        return url.toString();
      }
    }

    // Legacy behavior: replace localhost with the current hostname.
    const browserHostname = getBrowserHostname();
    if (
      isLocalhostHostname(url.hostname) &&
      browserHostname &&
      !isLocalhostHostname(browserHostname)
    ) {
      url.hostname = browserHostname;
      return url.toString();
    }

    return vsCodeUrl;
  } catch {
    // Silently handle the error and return the original URL
    return vsCodeUrl;
  }
}
