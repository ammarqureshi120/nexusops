import "reflect-metadata";
import "dotenv/config";

import { RUNTIME_CONFIG } from "./config/config.module";
import type { RuntimeConfig } from "./config/runtime-config";
import { createApplication } from "./application";

async function bootstrap(): Promise<void> {
  const app = await createApplication();
  const config = app.get<RuntimeConfig>(RUNTIME_CONFIG);
  await app.listen(config.port, "0.0.0.0");
}

bootstrap().catch((error: unknown) => {
  console.error("NexusOps API failed to start.", error);
  process.exitCode = 1;
});
