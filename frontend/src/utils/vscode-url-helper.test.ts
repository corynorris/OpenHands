import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { transformVSCodeUrl } from "./vscode-url-helper";
import { setSandboxUrlConfig } from "./sandbox-url-config";

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

describe("transformVSCodeUrl with OH_SANDBOX_CONTAINER_URL_PATTERN", () => {
  beforeEach(() => {
    setSandboxUrlConfig({
      sandboxContainerUrlPattern: "https://openhands-{port}.example.com",
      webUrl: "https://openhands.example.com",
    });
  });

  it("maps the VSCode port 8001 to the pattern host (issue #15347)", () => {
    const url = transformVSCodeUrl(
      "http://localhost:8001/?tkn=secret&folder=/workspace/project",
    );
    expect(url).toBe(
      "https://openhands-8001.example.com/?tkn=secret&folder=/workspace/project",
    );
  });

  it("maps worker port 8011 to the pattern host", () => {
    const url = transformVSCodeUrl("http://localhost:8011/");
    expect(url).toBe("https://openhands-8011.example.com/");
  });

  it("maps worker port 8012 to the pattern host", () => {
    const url = transformVSCodeUrl("http://localhost:8012/");
    expect(url).toBe("https://openhands-8012.example.com/");
  });

  it("supports the https://example.com:{port} pattern form", () => {
    setSandboxUrlConfig({
      sandboxContainerUrlPattern: "https://example.com:{port}",
      webUrl: "https://openhands.example.com",
    });
    const url = transformVSCodeUrl(
      "http://localhost:8001/?tkn=secret&folder=/workspace",
    );
    expect(url).toBe("https://example.com:8001/?tkn=secret&folder=/workspace");
  });

  it("leaves an already-public VS Code URL unchanged", () => {
    const url = transformVSCodeUrl(
      "https://openhands-8001.example.com/?tkn=secret&folder=/workspace",
    );
    expect(url).toBe(
      "https://openhands-8001.example.com/?tkn=secret&folder=/workspace",
    );
  });

  it("handles 127.0.0.1 as the internal host", () => {
    const url = transformVSCodeUrl("http://127.0.0.1:8001/?tkn=secret");
    expect(url).toBe("https://openhands-8001.example.com/?tkn=secret");
  });
});

describe("transformVSCodeUrl without a pattern (legacy behavior)", () => {
  it("rewrites localhost to the browser hostname but keeps the port", () => {
    const url = transformVSCodeUrl(
      "http://localhost:8001/?tkn=secret&folder=/workspace/project",
    );
    expect(url).toBe(
      "http://openhands.example.com:8001/?tkn=secret&folder=/workspace/project",
    );
  });

  it("returns the URL unchanged when accessed from localhost", () => {
    mockWindowLocation({
      hostname: "localhost",
      host: "localhost",
      protocol: "http:",
    });
    const url = transformVSCodeUrl("http://localhost:8001/?tkn=secret");
    expect(url).toBe("http://localhost:8001/?tkn=secret");
  });

  it("returns null for null input", () => {
    expect(transformVSCodeUrl(null)).toBeNull();
  });

  it("returns the original URL for invalid input", () => {
    expect(transformVSCodeUrl("not a url")).toBe("not a url");
  });

  it("uses OH_WEB_URL hostname for the rewrite when configured", () => {
    setSandboxUrlConfig({
      sandboxContainerUrlPattern: null,
      webUrl: "https://openhands.example.com",
    });
    const url = transformVSCodeUrl("http://localhost:8001/?tkn=secret");
    expect(url).toBe("http://openhands.example.com:8001/?tkn=secret");
  });
});
