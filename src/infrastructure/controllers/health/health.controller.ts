import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
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

    @Get('health/sso')
    @HealthCheck()
    ssoHealth(
        @Query('tenantId', new ParseIntPipe({ optional: true }))
        tenantId?: number,
        @Query('checkExternal') checkExternal?: string,
    ): Promise<HealthCheckResult> {
        const checkExternalServers = checkExternal === 'true';
        return this.healthCheck.check([
            (): Promise<HealthIndicatorResult> =>
                this.sso.pingCheck('sso', tenantId, checkExternalServers),
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
