import { SpineError, SpineErrorCode } from "@/shared/error";

type CoreErrorCode = Extract<SpineErrorCode, `CORE_${string}`>;

class CoreError extends SpineError {
  constructor(code: CoreErrorCode, message: string, options?: ErrorOptions) {
    super(code, message, options);
  }
}

export { CoreError };
