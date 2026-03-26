import { LetantError, LetantErrorCode } from "@/common/error";

type BinaryErrorCode = Extract<LetantErrorCode, `BIN_${string}`>;

class BinaryError extends LetantError {
  constructor(code: BinaryErrorCode, message: string, options?: ErrorOptions) {
    super(code, message, options);
  }
}

export default BinaryError;
