import { LetantError, LetantErrorCode } from "@/common/error";

type ConfigErrorCode = Extract<LetantErrorCode, `CONFIG_${string}`>;

class ConfigError extends LetantError {
  constructor(code: ConfigErrorCode, message: string, options?: ErrorOptions) {
    super(code, message, options);
  }
}

export default ConfigError;
