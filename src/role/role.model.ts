import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Injectable } from '@nestjs/common';
import { UserModel } from '../user/user.model';
import { UserRoleModel } from './user-role.model';

@Injectable()
@Table({ tableName: 'role' })
export class RoleModel extends Model<RoleModel> {
  @Column({
	type: DataType.INTEGER,
	unique: true,
	autoIncrement: true,
	primaryKey: true,
  })
  id: number;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  value: string;

  @Column({ type: DataType.STRING, allowNull: false })
  description: string;

  // Многие ко многим через промежуточную таблицу UserRoleModel
  @BelongsToMany(() => UserModel, () => UserRoleModel)
  users: UserModel[];
}
