import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModel } from './user.model';
import { RoleModel } from '../role/role.model';
import { RoleModule } from '../role/role.module';
import { UserRepository } from './user.repository';

@Module({
  imports: [SequelizeModule.forFeature([UserModel, RoleModel]), RoleModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
