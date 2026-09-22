import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { readRuntimeConfig } from "./config/runtime-config";

async function bootstrap(): Promise<void> {
  const config = readRuntimeConfig();
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.setGlobalPrefix("api/v1");
  app.enableShutdownHooks();

  if (config.corsOrigins.length > 0) {
    app.enableCors({
      credentials: true,
      origin: config.corsOrigins,
    });
  }

  await app.listen(config.port, "0.0.0.0");
}

bootstrap().catch((error: unknown) => {
  console.error("NexusOps API failed to start.", error);
  process.exitCode = 1;
});
