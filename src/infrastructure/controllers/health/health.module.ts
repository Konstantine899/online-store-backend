import { RepositoriesModule } from '@app/infrastructure/repositories/repositories.module';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { SequelizeHealthIndicator } from './sequelize.health';
import { SSOHealthIndicator } from './sso.health';

@Module({
    imports: [TerminusModule, RepositoriesModule],
    controllers: [HealthController],
    providers: [SequelizeHealthIndicator, SSOHealthIndicator],
})
export class HealthModule {}
