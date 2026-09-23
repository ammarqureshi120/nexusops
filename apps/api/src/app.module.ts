import { Module } from "@nestjs/common";

import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "./config/config.module";
import { PrismaModule } from "./database/prisma.module";
import { HealthController } from "./health/health.controller";
import { HealthService } from "./health/health.service";

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
