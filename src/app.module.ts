import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import * as process from 'process';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { TokenModule } from './modules/token/token.module';
import { RatingModule } from './modules/rating/rating.module';
import { PaymentModule } from './modules/payment/payment.module';
import { SequelizeConfigService } from './infrastructure/config/seauelize/config/sequelize.config.service';
import { databaseConfig } from './infrastructure/config/seauelize/config/config';
import { ControllersModule } from './infrastructure/controllers/controllers.module';
import { ServicesModule } from './infrastructure/services/services.module';
import { RepositoriesModule } from './infrastructure/repositories/repositories.module';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: path.resolve(__dirname, 'static'),
        }),

        SequelizeModule.forRootAsync({
            imports: [ConfigModule],
            useClass: SequelizeConfigService,
        }),
        ConfigModule.forRoot({
            envFilePath: `.${process.env.NODE_ENV}.env`,
            load: [databaseConfig],
        }),

        UserModule,
        RoleModule,
        TokenModule,
        RatingModule,
        PaymentModule,
        ControllersModule,
        ServicesModule,
        RepositoriesModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
