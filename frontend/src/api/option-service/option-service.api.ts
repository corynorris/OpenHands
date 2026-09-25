import { openHands } from "../open-hands-axios";
import { ModelsResponse, WebClientConfig } from "./option.types";
import { setSandboxUrlConfig } from "#/utils/sandbox-url-config";

/**
 * Service for handling API options endpoints
 */
class OptionService {
  /**
   * Retrieve the structured models response from the backend.
   *
   * The backend is the single source of truth for verified models,
   * verified providers, and provider assignment for bare model names.
   */
  static async getModels(): Promise<ModelsResponse> {
    const { data } = await openHands.get<ModelsResponse>("/api/options/models");
    return data;
  }

  /**
   * Retrieve the list of security analyzers available
   * @returns List of security analyzers available
   */
  static async getSecurityAnalyzers(): Promise<string[]> {
    const { data } = await openHands.get<string[]>(
      "/api/options/security-analyzers",
    );
    return data;
  }

  /**
   * Get the web client configuration from the server
   * @returns Web client configuration response
   */
  static async getConfig(): Promise<WebClientConfig> {
    const { data } = await openHands.get<WebClientConfig>(
      "/api/v1/web-client/config",
    );

    // Surface the sandbox URL mapping (OH_SANDBOX_CONTAINER_URL_PATTERN) and
    // the public web URL (OH_WEB_URL) to the URL-building utilities as soon as
    // the config is available, so WebSocket / VS Code / sandbox URLs are
    // rewritten against the configured pattern.
    setSandboxUrlConfig({
      sandboxContainerUrlPattern: data.sandbox_container_url_pattern,
      webUrl: data.web_url,
    });

    return data;
  }
}

export default OptionService;
