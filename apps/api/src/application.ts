import {
  BadRequestException,
  type INestApplication,
  type NestApplicationOptions,
  ValidationPipe,
} from "@nestjs/common";
import type { ValidationError } from "class-validator";
import cookieParser from "cookie-parser";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { ProblemDetailsFilter } from "./common/http/problem-details.filter";
import { createOriginProtection } from "./common/security/origin-protection";
import { RUNTIME_CONFIG } from "./config/config.module";
import type { RuntimeConfig } from "./config/runtime-config";

function validationErrors(errors: ValidationError[]): Record<string, string[]> {
  return Object.fromEntries(
    errors.map((error) => [
      error.property,
      Object.values(error.constraints ?? { invalid: "Value is invalid." }),
    ]),
  );
}

export async function createApplication(
  options?: NestApplicationOptions,
): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, options);
  const config = app.get<RuntimeConfig>(RUNTIME_CONFIG);

  app.use(helmet());
  app.use(cookieParser());
  app.use(createOriginProtection(config.corsOrigins));
  app.setGlobalPrefix("api/v1");
  app.useGlobalFilters(new ProblemDetailsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: "validation_failed",
          detail: "Please correct the highlighted fields.",
          errors: validationErrors(errors),
        }),
    }),
  );
  app.enableCors({
    credentials: true,
    origin: config.corsOrigins,
  });
  app.enableShutdownHooks();
  await app.init();
  return app;
}
