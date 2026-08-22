import { SkillsClient } from "@openhands/typescript-client/clients";
import { SkillInfo } from "#/types/settings";
import { getAgentServerWorkingDir } from "./agent-server-config";
import { getActiveBackend } from "./backend-registry/active-store";
import { fetchCloudSkills } from "./cloud/skills-service.api";
import { getAgentServerClientOptions } from "./agent-server-client-options";

class SkillsService {
  static async getSkills(projectDir?: string): Promise<SkillInfo[]> {
    if (getActiveBackend().backend.kind === "cloud") {
      return fetchCloudSkills();
    }

    // Built-in public skills (the @openhands/extensions SKILLS_CATALOG bundle)
    // have been removed — the UI only surfaces user and project skills from
    // local .agents/skills/ content, fetched from the agent-server.
    try {
      const response = await new SkillsClient(
        getAgentServerClientOptions(),
      ).getSkills({
        load_public: false,
        load_user: true,
        load_project: true,
        load_org: false,
        project_dir: projectDir ?? getAgentServerWorkingDir(),
      });
      return (response.skills ?? []) as SkillInfo[];
    } catch {
      // Agent-server may not support the skills endpoint or may be
      // unreachable; there is no bundled fallback anymore.
      return [];
    }
  }
}

export default SkillsService;
