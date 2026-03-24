import path from "node:path";
import { cwd } from "node:process";

import type { Config } from "@/models/config";

import ConfigError from "./error";

/**
 * Asserts that the given configuration file path is valid.
 * @param configPath The configuration file path to check.
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

function loadConfig(configPath: unknown): Config {
  assertConfigPath(configPath);
  const resolved = path.resolve(cwd(), configPath);
  try {
    return require(resolved);
  } catch (e) {
    throw new ConfigError(
      "CONFIG_INVALID_SCHEMA",
      `Failed to load config at "${resolved}"`,
      { cause: e },
    );
  }
}

export { loadConfig };
