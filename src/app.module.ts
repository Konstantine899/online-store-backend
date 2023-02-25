import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
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
