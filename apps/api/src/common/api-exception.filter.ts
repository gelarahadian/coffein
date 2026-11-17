import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

interface HttpExceptionBody {
  message?: string | string[];
  error?: string;
}

/**
 * Filter global: semua error dibungkus envelope { success: false, error }.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Terjadi kesalahan internal";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as HttpExceptionBody | string;
      if (typeof body === "string") {
        message = body;
      } else if (Array.isArray(body.message)) {
        message = body.message.join("; ");
      } else if (typeof body.message === "string") {
        message = body.message;
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        JSON.stringify({
          event: "http.exception",
          method: request.method,
          path: request.path,
          statusCode: status,
          message,
        }),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    res.status(status).json({
      success: false,
      error: { message },
    });
  }
}
