import path, { join } from "node:path";
import { cwd } from "node:process";

import { ConfigError } from "./error";
import { Config } from "./types";

/**
 * Asserts that the given configuration file path is valid.
 * @param configPath The configuration file path to check.
 * @throws If `configPath` is not a non-empty string.
 */
function assertConfigPath(configPath: string): void {
  if (!configPath) {
    throw new ConfigError(
      "CONFIG_INVALID_PATH",
      "'configPath' must be a non-empty string",
    );
  }
}

function resolveConfigPath(configPath: string): string {
  assertConfigPath(configPath);
  return path.resolve(join(cwd(), configPath));
}

function loadConfig(configPath: string): Config {
  const resolved = resolveConfigPath(configPath);
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
