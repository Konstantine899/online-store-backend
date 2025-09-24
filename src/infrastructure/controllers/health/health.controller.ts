import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SequelizeHealthIndicator } from './sequelize.health';

@Controller()
export class HealthController {
    constructor(
        private readonly healthCheck: HealthCheckService,
        private readonly db: SequelizeHealthIndicator,
    ) {}

    @Get('health')
    @HealthCheck()
    health() {
        return this.healthCheck.check([() => this.db.pingCheck()]);
    }

    @Get('live')
    live() {
        return { status: 'ok' };
    }

    @Get('ready')
    @HealthCheck()
    ready() {
        return this.healthCheck.check([() => this.db.pingCheck()]);
    }
}
