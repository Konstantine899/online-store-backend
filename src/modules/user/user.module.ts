import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModel } from './user.model';
import { RoleModel } from '../role/role.model';
import { RoleModule } from '../role/role.module';
import { UserRepository } from './user.repository';
import { RatingModel } from '../../domain/models/rating.model';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        SequelizeModule.forFeature([UserModel, RoleModel, RatingModel]),
        RoleModule,
        JwtModule,
    ],
    controllers: [UserController],
    providers: [UserService, UserRepository],
    exports: [UserService, UserRepository],
})
export class UserModule {}
