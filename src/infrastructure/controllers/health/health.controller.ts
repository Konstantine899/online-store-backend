import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckResult,
    HealthCheckService,
    HealthIndicatorResult,
} from '@nestjs/terminus';
import { SequelizeHealthIndicator } from './sequelize.health';
import { SSOHealthIndicator } from './sso.health';

@Controller()
export class HealthController {
    constructor(
        private readonly healthCheck: HealthCheckService,
        private readonly db: SequelizeHealthIndicator,
        private readonly sso: SSOHealthIndicator,
    ) {}

    @Get('health')
    @HealthCheck()
    health(): Promise<HealthCheckResult> {
        return this.healthCheck.check([
            (): Promise<HealthIndicatorResult> => this.db.pingCheck(),
            (): Promise<HealthIndicatorResult> => this.sso.pingCheck(),
        ]);
    }

    @Get('live')
    live(): { status: string } {
        return { status: 'ok' };
    }

    @Get('ready')
    @HealthCheck()
    ready(): Promise<HealthCheckResult> {
        return this.healthCheck.check([
            (): Promise<HealthIndicatorResult> => this.db.pingCheck(),
            (): Promise<HealthIndicatorResult> => this.sso.pingCheck(),
        ]);
    }
}
