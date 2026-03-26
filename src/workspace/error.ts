import { LetantError, LetantErrorCode } from "@/common/error";

type WorkspaceErrorCode = Extract<LetantErrorCode, `WORKSPACE_${string}`>;

class WorkspaceError extends LetantError {
  constructor(
    code: WorkspaceErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(code, message, options);
  }
}

export default WorkspaceError;
