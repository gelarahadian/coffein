import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";

interface HttpExceptionBody {
  message?: string | string[];
  error?: string;
}

/**
 * Filter global: semua error dibungkus envelope { success: false, error }.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

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

    res.status(status).json({
      success: false,
      error: { message },
    });
  }
}
