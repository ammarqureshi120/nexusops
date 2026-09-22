import { Injectable } from "@nestjs/common";

export interface HealthStatus {
  service: "nexusops-api";
  status: "ok";
}

@Injectable()
export class HealthService {
  getStatus(): HealthStatus {
    return {
      service: "nexusops-api",
      status: "ok",
    };
  }
}
