import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  buildWebSocketUrl,
  buildHttpBaseUrl,
  extractBaseHost,
} from "./websocket-url";
import {
  setSandboxUrlConfig,
  getSandboxContainerUrlPattern,
} from "./sandbox-url-config";

const ORIGINAL_LOCATION = window.location;

function mockWindowLocation(location: {
  hostname: string;
  host: string;
  protocol: string;
}) {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: {
      ...ORIGINAL_LOCATION,
      ...location,
    },
  });
}

beforeEach(() => {
  // Reset module-level sandbox URL config (synced from /api/v1/web-client/config).
  setSandboxUrlConfig({
    sandboxContainerUrlPattern: null,
    webUrl: null,
  });
  mockWindowLocation({
    hostname: "openhands.example.com",
    host: "openhands.example.com",
    protocol: "https:",
  });
});

afterEach(() => {
  setSandboxUrlConfig({
    sandboxContainerUrlPattern: null,
    webUrl: null,
  });
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: ORIGINAL_LOCATION,
  });
});

describe("buildWebSocketUrl with OH_SANDBOX_CONTAINER_URL_PATTERN", () => {
  beforeEach(() => {
    setSandboxUrlConfig({
      sandboxContainerUrlPattern: "https://openhands-{port}.example.com",
      webUrl: "https://openhands.example.com",
    });
  });

  it("maps internal localhost:8000 agent-server to the pattern host (no stray port)", () => {
    const url = buildWebSocketUrl(
      "abc",
      "http://localhost:8000/api/conversations/abc",
    );
    expect(url).toBe("wss://openhands-8000.example.com/sockets/events/abc");
  });

  it("maps 127.0.0.1 to the pattern host", () => {
    const url = buildWebSocketUrl(
      "abc",
      "http://127.0.0.1:8000/api/conversations/abc",
    );
    expect(url).toBe("wss://openhands-8000.example.com/sockets/events/abc");
  });

  it("uses ws: for an http pattern", () => {
    setSandboxUrlConfig({
      sandboxContainerUrlPattern: "http://sandbox-{port}.example.com",
      webUrl: "https://openhands.example.com",
    });
    const url = buildWebSocketUrl(
      "abc",
      "http://localhost:8000/api/conversations/abc",
    );
    expect(url).toBe("ws://sandbox-8000.example.com/sockets/events/abc");
  });

  it("supports the https://example.com:{port} pattern form", () => {
    setSandboxUrlConfig({
      sandboxContainerUrlPattern: "https://example.com:{port}",
      webUrl: "https://openhands.example.com",
    });
    const url = buildWebSocketUrl(
      "abc",
      "http://localhost:8000/api/conversations/abc",
    );
    expect(url).toBe("wss://example.com:8000/sockets/events/abc");
  });

  it("preserves a path prefix (e.g. /runtime/55313)", () => {
    const url = buildWebSocketUrl(
      "abc",
      "http://localhost:8000/runtime/55313/api/conversations/abc",
    );
    expect(url).toBe(
      "wss://openhands-8000.example.com/runtime/55313/sockets/events/abc",
    );
  });

  it("leaves an already-public conversation URL unchanged", () => {
    const url = buildWebSocketUrl(
      "abc",
      "https://openhands-8000.example.com/api/conversations/abc",
    );
    expect(url).toBe("wss://openhands-8000.example.com/sockets/events/abc");
  });

  it("keeps the sandbox scheme (http pattern -> ws) even when the page is https", () => {
    mockWindowLocation({
      hostname: "openhands.example.com",
      host: "openhands.example.com",
      protocol: "https:",
    });
    setSandboxUrlConfig({
      sandboxContainerUrlPattern: "http://openhands-{port}.example.com",
      webUrl: "https://openhands.example.com",
    });
    const url = buildWebSocketUrl(
      "abc",
      "http://localhost:8000/api/conversations/abc",
    );
    expect(url).toBe("ws://openhands-8000.example.com/sockets/events/abc");
  });
});

describe("buildWebSocketUrl without a pattern (legacy behavior)", () => {
  it("rewrites localhost to the browser hostname but keeps the internal port", () => {
    const url = buildWebSocketUrl(
      "abc",
      "http://localhost:8000/api/conversations/abc",
    );
    expect(url).toBe("wss://openhands.example.com:8000/sockets/events/abc");
  });

  it("uses ws: when the page is served over http", () => {
    mockWindowLocation({
      hostname: "openhands.example.com",
      host: "openhands.example.com",
      protocol: "http:",
    });
    const url = buildWebSocketUrl(
      "abc",
      "http://localhost:8000/api/conversations/abc",
    );
    expect(url).toBe("ws://openhands.example.com:8000/sockets/events/abc");
  });

  it("keeps the original host when accessed from localhost", () => {
    mockWindowLocation({
      hostname: "localhost",
      host: "localhost",
      protocol: "http:",
    });
    const url = buildWebSocketUrl(
      "abc",
      "http://localhost:8000/api/conversations/abc",
    );
    expect(url).toBe("ws://localhost:8000/sockets/events/abc");
  });

  it("returns null when the conversation id is missing", () => {
    expect(buildWebSocketUrl(undefined, "http://localhost:8000/x")).toBeNull();
  });

  it("falls back to the window host when no conversation URL is given", () => {
    const url = buildWebSocketUrl("abc", null);
    expect(url).toBe("wss://openhands.example.com/sockets/events/abc");
  });
});

describe("buildHttpBaseUrl", () => {
  it("maps localhost to the pattern host with the pattern scheme", () => {
    setSandboxUrlConfig({
      sandboxContainerUrlPattern: "https://openhands-{port}.example.com",
      webUrl: "https://openhands.example.com",
    });
    const url = buildHttpBaseUrl("http://localhost:8000/api/conversations/abc");
    expect(url).toBe("https://openhands-8000.example.com");
  });

  it("uses http scheme when the page is http and no pattern applies", () => {
    mockWindowLocation({
      hostname: "openhands.example.com",
      host: "openhands.example.com",
      protocol: "http:",
    });
    const url = buildHttpBaseUrl("http://localhost:8000/api/conversations/abc");
    expect(url).toBe("http://openhands.example.com:8000");
  });
});

describe("extractBaseHost", () => {
  it("returns the pattern host for a localhost internal URL", () => {
    setSandboxUrlConfig({
      sandboxContainerUrlPattern: "https://openhands-{port}.example.com",
      webUrl: "https://openhands.example.com",
    });
    expect(extractBaseHost("http://localhost:8000/api/conversations/abc")).toBe(
      "openhands-8000.example.com",
    );
  });

  it("ignores a localhost pattern (default) and falls back to the browser host", () => {
    setSandboxUrlConfig({
      sandboxContainerUrlPattern: "http://localhost:{port}",
      webUrl: null,
    });
    expect(extractBaseHost("http://localhost:8000/api/conversations/abc")).toBe(
      "openhands.example.com:8000",
    );
  });

  it("uses OH_WEB_URL host as fallback when no conversation URL is given", () => {
    setSandboxUrlConfig({
      sandboxContainerUrlPattern: null,
      webUrl: "https://openhands.example.com",
    });
    expect(extractBaseHost(null)).toBe("openhands.example.com");
  });
});

describe("module config helpers", () => {
  it("getSandboxContainerUrlPattern reflects the configured pattern", () => {
    setSandboxUrlConfig({
      sandboxContainerUrlPattern: "https://openhands-{port}.example.com",
    });
    expect(getSandboxContainerUrlPattern()).toBe(
      "https://openhands-{port}.example.com",
    );
  });
});
