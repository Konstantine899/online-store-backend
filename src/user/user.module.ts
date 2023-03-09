import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModel } from './user.model';
import { RoleModel } from '../role/role.model';
import { RoleModule } from '../role/role.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [SequelizeModule.forFeature([UserModel, RoleModel]), RoleModule],
  exports: [UserService],
})
export class UserModule {}
