import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class SequelizeHealthIndicator extends HealthIndicator {
  constructor(private readonly sequelize: Sequelize) { super(); }

  async pingCheck(key = 'database'): Promise<HealthIndicatorResult> {
    try {
      await this.sequelize.authenticate();
      return this.getStatus(key, true);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'unhealthy';
        return this.getStatus(key, false, { message });    }
  }
}