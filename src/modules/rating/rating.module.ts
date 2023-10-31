import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RatingModel } from './rating.model';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { RatingRepository } from './rating.repository';
// import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ServicesModule } from '../../infrastructure/services/services.module';
import { RepositoriesModule } from '../../infrastructure/repositories/repositories.module';

@Module({
    imports: [
        SequelizeModule.forFeature([RatingModel]),
        ServicesModule,
        RepositoriesModule,
        UserModule,
        JwtModule,
    ],
    controllers: [RatingController],
    providers: [RatingService, RatingRepository],
})
export class RatingModule {}
