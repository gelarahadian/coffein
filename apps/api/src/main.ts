import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Dynamic CORS: Allow frontend origin + ngrok for development
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";
  const allowedOrigins = [frontendOrigin];

  // Add ngrok URL from env if specified (for development)
  const ngrokOrigin = process.env.NGROK_ORIGIN;
  if (ngrokOrigin) {
    allowedOrigins.push(ngrokOrigin);
  }

  // Development: allow all origins if ALLOW_ALL_CORS=1
  if (process.env.ALLOW_ALL_CORS === "1") {
    app.setGlobalPrefix("api");
    app.use((req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
      const origin = req.headers.origin;
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With",
      );
      if (req.method === "OPTIONS") {
        res.status(204).end();
      } else {
        next();
      }
    });
  } else {
    app.enableCors({
      origin: allowedOrigins,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
  }

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

void bootstrap();