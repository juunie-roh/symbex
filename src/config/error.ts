import { SpineError, SpineErrorCode } from "@/shared/error";

type ConfigErrorCode = Extract<SpineErrorCode, `CONFIG_${string}`>;

class ConfigError extends SpineError {
  constructor(code: ConfigErrorCode, message: string, options?: ErrorOptions) {
    super(code, message, options);
  }
}

export { ConfigError };
