import { LetantError, LetantErrorCode } from "@/common/error";

type CoreErrorCode = Extract<LetantErrorCode, `CORE_${string}`>;

class CoreError extends LetantError {
  constructor(code: CoreErrorCode, message: string, options?: ErrorOptions) {
    super(code, message, options);
  }
}

export default CoreError;
