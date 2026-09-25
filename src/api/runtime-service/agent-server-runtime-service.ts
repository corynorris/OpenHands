import { FileClient, BashClient } from "@openhands/typescript-client/clients";
import type { BashOutput } from "@openhands/typescript-client";
import { RemoteWorkspace } from "@openhands/typescript-client/workspace/remote-workspace";
import { getAgentServerClientOptions } from "#/api/agent-server-client-options";
import { getActiveBackend } from "#/api/backend-registry/active-store";

export interface CommandResult {
  exit_code: number;
  stdout: string;
  stderr: string;
}

/**
 * Cloud-aware runtime operations for agent-server conversations.
 *
 * In **local** mode the runtime is reachable directly from the browser
 * (e.g. `127.0.0.1:18000`) so the SDK's typed clients work fine.
 * In **cloud** mode the runtime lives at `*.prod-runtime.all-hands.dev`,
 * whose CORS allowlist (`OH_ALLOW_CORS_ORIGINS`, set to the Canvas origin
 * in saas-deploy) permits direct browser calls authenticated with the
 * conversation's `X-Session-API-Key`. So both modes now use the same
 * direct typed-client path against the per-conversation runtime URL.
 */
class AgentServerRuntimeService {
  static async executeCommand(
    conversationUrl: string | null | undefined,
    sessionApiKey: string | null | undefined,
    command: string,
    cwd?: string,
    timeout = 30,
  ): Promise<CommandResult> {
    const active = getActiveBackend().backend;

    if (active.kind === "cloud" && !conversationUrl) {
      throw new Error(
        "AgentServerRuntimeService.executeCommand requires a conversation URL on cloud backends",
      );
    }

    // `RemoteWorkspace.executeCommand` forwards `timeout` (seconds) to the
    // agent-server as the command timeout AND sets the HTTP request timeout to
    // `(timeout + 10) * 1000` ms — the same +10s buffer the old cloud
    // `callCloudProxy` branch used (`timeoutSeconds: timeout + 10`). We
    // deliberately do NOT pass `timeout` into `getAgentServerClientOptions`:
    // that option is the SDK HttpClient's default timeout in *milliseconds*,
    // so a seconds value (e.g. 30) would be read as 30 ms. The per-request
    // timeout the SDK sets on `executeCommand` overrides the client default
    // anyway, but passing a ms-mismatched default is a latent footgun if any
    // method on the client ever lacks a per-request timeout.
    const result = await new RemoteWorkspace(
      getAgentServerClientOptions({ conversationUrl, sessionApiKey }),
    ).executeCommand(command, cwd, timeout);
    // The SDK already coerces these (`exit_code ?? 0`, `stdout || ''`,
    // `stderr || ''`); keep a defensive fallback so a contract drift in the
    // client can never surface `undefined` to callers.
    return {
      exit_code: result.exit_code ?? -1,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  }

  /**
   * Execute a command and reassemble the COMPLETE stdout/stderr from the
   * chunked BashOutput event stream.
   *
   * Why this exists: the agent-server streams bash stdout in 1MB chunks
   * (MAX_CONTENT_CHAR_LENGTH) and `POST /api/bash/execute_bash_command` only
   * returns the LAST chunk (`page.items[-1]`). For commands whose output
   * exceeds 1MB — like the workspace `find | sort` listing on a large repo —
   * the first chunks (the lexically-earliest paths) are silently dropped, so
   * folders like `addons/` or `data/` never reach the UI. This method starts
   * the command, polls the event store for every BashOutput chunk (ordered by
   * `order`), and concatenates them.
   *
   * Local only: cloud runtimes never use bash for file listing (they hit the
   * first-class `/files` endpoint), so cloud keeps the single-shot path.
   */
  static async executeCommandCollectingChunks(
    conversationUrl: string | null | undefined,
    sessionApiKey: string | null | undefined,
    command: string,
    cwd?: string,
    timeout = 30,
  ): Promise<CommandResult> {
    const active = getActiveBackend().backend;

    if (active.kind === "cloud" && conversationUrl) {
      return AgentServerRuntimeService.executeCommand(
        conversationUrl,
        sessionApiKey,
        command,
        cwd,
        timeout,
      );
    }

    const options = getAgentServerClientOptions({
      conversationUrl,
      sessionApiKey,
    });
    const client = new BashClient({
      host: options.host,
      apiKey: options.apiKey,
      timeout: (timeout + 10) * 1000,
    });

    // NOTE: pass the command as a string — BashClient.normalizeRequest only
    // forwards `cwd`/`timeout` for string requests, and an object form would
    // silently run the command in the agent-server's default directory.
    const started = await client.startCommand(command, cwd, timeout);

    const deadline = Date.now() + (timeout + 10) * 1000;
    const chunks = new Map<number, BashOutput>();
    let finalEvent: BashOutput | null = null;

    while (Date.now() < deadline) {
      const page = await client.searchEvents({
        command_id__eq: started.id,
        limit: 100,
      });

      for (const item of page.items) {
        if (item.kind !== "BashOutput") continue;
        const output = item as BashOutput;
        if (output.exit_code !== undefined && output.exit_code !== null) {
          finalEvent = output;
        } else if (output.stdout != null || output.stderr != null) {
          chunks.set(output.order, output);
        }
      }

      if (finalEvent) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    if (!finalEvent) {
      throw new Error("Timed out waiting for bash command output");
    }

    const orders = [...chunks.keys()].sort((a, b) => a - b);
    let stdout = "";
    let stderr = "";
    for (const order of orders) {
      const chunk = chunks.get(order);
      stdout += chunk?.stdout ?? "";
      stderr += chunk?.stderr ?? "";
    }
    stdout += finalEvent.stdout ?? "";
    stderr += finalEvent.stderr ?? "";

    return { exit_code: finalEvent.exit_code ?? -1, stdout, stderr };
  }

  static async downloadFile(
    conversationUrl: string | null | undefined,
    sessionApiKey: string | null | undefined,
    path: string,
  ): Promise<ArrayBuffer> {
    const active = getActiveBackend().backend;

    if (active.kind === "cloud" && !conversationUrl) {
      throw new Error(
        "AgentServerRuntimeService.downloadFile requires a conversation URL on cloud backends",
      );
    }

    return new FileClient(
      getAgentServerClientOptions({ conversationUrl, sessionApiKey }),
    ).downloadFile(path);
  }
}

export default AgentServerRuntimeService;
