import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type { AuthenticatedRequest, SafeUser } from "./auth.types";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SafeUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
