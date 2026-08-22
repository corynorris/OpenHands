import { SkillsClient } from "@openhands/typescript-client/clients";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetActiveStoreForTests,
  setActiveSelection,
  setRegisteredBackends,
} from "#/api/backend-registry/active-store";
import type { Backend } from "#/api/backend-registry/types";

const { mockGetSkills } = vi.hoisted(() => ({
  mockGetSkills: vi.fn(),
}));

vi.mock("@openhands/typescript-client/clients", () => ({
  SkillsClient: vi.fn(function SkillsClientMock() {
    return { getSkills: mockGetSkills };
  }),
}));

import SkillsService from "#/api/skills-service";

const localBackend: Backend = {
  id: "local",
  name: "Local",
  host: "http://127.0.0.1:8000",
  apiKey: "",
  kind: "local",
};

beforeEach(() => {
  window.localStorage.clear();
  __resetActiveStoreForTests();
  setRegisteredBackends([localBackend]);
  setActiveSelection({ backendId: localBackend.id });
  mockGetSkills.mockReset();
  vi.mocked(SkillsClient).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  __resetActiveStoreForTests();
});

describe("SkillsService.getSkills against the agent-server backend", () => {
  it("requests only user/project skills from agent-server (load_public: false) and returns only those", async () => {
    const userSkill = {
      name: "my-custom-skill",
      type: "knowledge",
      content: "custom content",
      triggers: [],
      source: "user",
      is_agentskills_format: false,
    };
    mockGetSkills.mockResolvedValue({
      skills: [userSkill],
      sources: { sandbox: 0, sdk_base: 0, org: 0, project: 0 },
    });

    const skills = await SkillsService.getSkills();

    // Agent-server is asked only for user/project skills, not public.
    expect(mockGetSkills).toHaveBeenCalledTimes(1);
    expect(mockGetSkills.mock.calls[0]?.[0]).toMatchObject({
      load_public: false,
      load_user: true,
      load_project: true,
      load_org: false,
    });

    // Built-ins were removed: the result is exactly the agent-server list,
    // with no bundled public catalog appended.
    expect(skills).toHaveLength(1);
    expect(skills[0]?.name).toBe("my-custom-skill");
  });

  it("returns an empty list when agent-server is unreachable (no bundled fallback)", async () => {
    mockGetSkills.mockRejectedValue(new Error("ECONNREFUSED"));

    const skills = await SkillsService.getSkills();

    expect(skills).toHaveLength(0);
  });
});
