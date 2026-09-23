import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";

interface ExceptionBody {
  code?: string;
  detail?: string;
  errors?: Record<string, string[]>;
  message?: string | string[];
}

const STATUS_TITLES: Record<number, string> = {
  400: "Bad request",
  401: "Authentication required",
  403: "Request forbidden",
  404: "Not found",
  409: "Conflict",
  429: "Too many requests",
  500: "Internal server error",
};

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = this.readExceptionBody(exception);
    const code = body.code ?? this.defaultCode(status);
    const requestId = randomUUID();

    response.setHeader("X-Request-Id", requestId);
    response.status(status).json({
      type: `https://nexusops.dev/problems/${code}`,
      title: STATUS_TITLES[status] ?? "Request failed",
      status,
      code,
      detail: this.detail(status, body),
      instance: request.originalUrl,
      requestId,
      ...(body.errors === undefined ? {} : { errors: body.errors }),
    });
  }

  private readExceptionBody(exception: unknown): ExceptionBody {
    if (!(exception instanceof HttpException)) {
      return {};
    }
    const response = exception.getResponse();
    return typeof response === "string" ? { detail: response } : response;
  }

  private detail(status: number, body: ExceptionBody): string {
    if (status >= 500) {
      return "The server could not complete the request.";
    }
    if (body.detail !== undefined) {
      return body.detail;
    }
    if (typeof body.message === "string") {
      return body.message;
    }
    return STATUS_TITLES[status] ?? "The request could not be completed.";
  }

  private defaultCode(status: number): string {
    const codes: Record<number, string> = {
      400: "bad_request",
      401: "authentication_required",
      403: "forbidden",
      404: "not_found",
      409: "conflict",
      429: "rate_limited",
    };
    return codes[status] ?? "internal_error";
  }
}
