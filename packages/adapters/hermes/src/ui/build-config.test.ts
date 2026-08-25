import { describe, expect, it } from "vitest";
import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import { buildHermesConfig } from "./build-config.js";

function values(overrides: Partial<CreateConfigValues> = {}): CreateConfigValues {
  return {
    model: "gpt-5.6-sol",
    maxTurnsPerRun: 30,
    cwd: "",
    command: "",
    extraArgs: "",
    thinkingEffort: "xhigh",
    promptTemplate: "",
    ...overrides,
  } as CreateConfigValues;
}

describe("buildHermesConfig reasoning arguments", () => {
  it("uses the current Hermes --reasoning flag", () => {
    const config = buildHermesConfig(values());
    expect(config.extraArgs).toEqual(["--reasoning", "xhigh"]);
  });

  it("removes obsolete and duplicate reasoning flags before applying the selection", () => {
    const config = buildHermesConfig(values({
      extraArgs: "--checkpoints --reasoning-effort medium --reasoning=high --verbose",
    }));
    expect(config.extraArgs).toEqual(["--checkpoints", "--verbose", "--reasoning", "xhigh"]);
  });
});
