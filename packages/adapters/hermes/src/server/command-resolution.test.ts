import os from "node:os";
import path from "node:path";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { expect, test } from "vitest";

import { HERMES_CLI } from "../shared/constants.js";
import { resolveHermesCommand } from "./execute.js";
import { testEnvironment } from "./test.js";

test("resolveHermesCommand prefers hermesCommand over command", () => {
  expect(resolveHermesCommand({ hermesCommand: "hermes_maximus", command: "hermes_backup" }))
    .toBe("hermes_maximus");
});

test("resolveHermesCommand falls back to command before default hermes binary", () => {
  expect(resolveHermesCommand({ command: "hermes_maximus" })).toBe("hermes_maximus");
  expect(resolveHermesCommand({})).toBe(HERMES_CLI);
});

test("testEnvironment accepts config.command when hermesCommand is absent", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "hermes-command-resolution-"));
  const isWindows = process.platform === "win32";
  const cliPath = isWindows ? process.execPath : path.join(tempDir, "fake-hermes");
  const expectedVersion = isWindows ? process.version : "fake-hermes 1.2.3";

  try {
    if (!isWindows) {
      await writeFile(cliPath, "#!/bin/sh\necho fake-hermes 1.2.3\n", "utf8");
      await chmod(cliPath, 0o755);
    }

    const result = await testEnvironment({
      companyId: "company-test",
      adapterType: "hermes_local",
      config: {
        command: cliPath,
      },
    });

    expect(result.status).not.toBe("fail");
    expect(result.checks.some((check) => check.code === "hermes_cli_not_found")).toBe(false);
    expect(result.checks.some(
      (check) => check.code === "hermes_version" && check.message.includes(expectedVersion),
    )).toBe(true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
