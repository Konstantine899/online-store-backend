import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import * as process from 'process';
import {
    SequelizeConfigService,
    databaseConfig,
} from '@app/infrastructure/config/sequelize';
import { ControllersModule } from './infrastructure/controllers/controllers.module';
import { ServicesModule } from './infrastructure/services/services.module';
import { RepositoriesModule } from './infrastructure/repositories/repositories.module';
import { HealthModule } from './infrastructure/controllers/health/health.module';



@Module({
    imports: [
        SequelizeModule.forRootAsync({
            imports: [ConfigModule],
            useClass: SequelizeConfigService,
        }),
        ConfigModule.forRoot({
            envFilePath: `.${process.env.NODE_ENV}.env`,
            load: [databaseConfig],
        }),

        ControllersModule,
        ServicesModule,
        RepositoriesModule,
        HealthModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
