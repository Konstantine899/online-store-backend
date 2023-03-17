import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { UserRoleModel } from '../role/user-role.model';
import { RoleModel } from '../role/role.model';

interface IUserCreationAttributes {
  email: string;
  password: string;
}

@Table({ tableName: 'user' })
export class UserModel extends Model<UserModel, IUserCreationAttributes> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ type: DataType.STRING, unique: true })
  email: string;

  @Column({ type: DataType.STRING })
  password: string;

  // Многие ко многим через промежуточную таблицу UserRoleModel
  @BelongsToMany(() => RoleModel, () => UserRoleModel)
  roles: RoleModel[];
}
