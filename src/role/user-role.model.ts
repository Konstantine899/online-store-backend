import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { UserModel } from '../user/user.model';
import { RoleModel } from './role.model';

@Table({ tableName: 'user_role', createdAt: false, updatedAt: false })
export class UserRoleModel extends Model<UserModel> {
  @ForeignKey(() => RoleModel)
  @Column({ type: DataType.INTEGER })
  roleId: number;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.INTEGER })
  userId: number;
}
