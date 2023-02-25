import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import * as process from 'process';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: `.${process.env.NODE_ENV}.env` }),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'Konstantine899',
      password: '4343',
      database: 'online-store',
      models: [],
      autoLoadModels: true, // автоматическая загрузка моделей
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
