import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoleModel } from './role.model';
import { UserModel } from '../user/user.model';
import { UserRoleModel } from './user-role.model';
import { RoleRepository } from './role.repository';
import { RoleGuard } from './role.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [RoleService, RoleRepository, RoleGuard],
  controllers: [RoleController],
  imports: [
	SequelizeModule.forFeature([RoleModel, UserModel, UserRoleModel]),
	JwtModule,
  ],
  exports: [RoleService, RoleRepository, RoleGuard],
})
export class RoleModule {}
