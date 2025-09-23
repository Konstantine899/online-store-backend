import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { SequelizeHealthIndicator } from './sequelize.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [SequelizeHealthIndicator],
})
export class HealthModule {}