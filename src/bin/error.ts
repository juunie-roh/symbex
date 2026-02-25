import { SpineError, SpineErrorCode } from "@/shared/error";

type BinaryErrorCode = Extract<SpineErrorCode, `BIN_${string}`>;

class BinaryError extends SpineError {
  constructor(code: BinaryErrorCode, message: string, options?: ErrorOptions) {
    super(code, message, options);
  }
}

export { BinaryError };
