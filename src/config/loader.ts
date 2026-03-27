import { readFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";

import type { Config } from "@/models/config";

import ConfigError from "./error";

async function loadConfig(configPath: unknown): Promise<Config> {
  assertConfigPath(configPath);
  try {
    const config = readFileSync(path.resolve(cwd(), configPath), "utf-8");
    return JSON.parse(config) as Config;
  } catch (e) {
    throw new ConfigError(
      "CONFIG_INVALID_SCHEMA",
      `Failed to load config at "${configPath}"`,
      { cause: e },
    );
  }
}

/**
 * Coerces the given configuration file path to be valid.
 * @throws If `configPath` is not a non-empty string.
 */
function assertConfigPath(configPath: unknown): asserts configPath is string {
  if (!configPath || typeof configPath !== "string" || configPath.length <= 0) {
    throw new ConfigError(
      "CONFIG_INVALID_PATH",
      "'configPath' must be a non-empty string",
    );
  }
}

export { loadConfig };
