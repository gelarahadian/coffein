import { Injectable, Logger, type NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = request.header("X-Request-Id") ?? randomUUID();
    const startedAt = process.hrtime.bigint();

    response.setHeader("X-Request-Id", requestId);
    response.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const message = JSON.stringify({
        event: "http.request",
        requestId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
      });

      if (response.statusCode >= 500) {
        this.logger.error(message);
      } else if (response.statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}
