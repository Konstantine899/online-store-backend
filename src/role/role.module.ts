import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoleModel } from './role.model';
import { UserModel } from '../user/user.model';
import { UserRoleModel } from './user-role.model';
import { RoleRepository } from './role.repository';

@Module({
  providers: [RoleService, RoleRepository],
  controllers: [RoleController],
  imports: [SequelizeModule.forFeature([RoleModel, UserModel, UserRoleModel])],
  exports: [RoleService, RoleRepository],
})
export class RoleModule {}
