import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { UserModel } from '../user/user.model';

@Table({
  tableName: 'refresh_token',
  underscored: true,
  defaultScope: {
	attributes: { exclude: [`updatedAt`, `createdAt`] },
  },
})
export class RefreshTokenModel extends Model<RefreshTokenModel> {
  @Column({
	type: DataType.INTEGER,
	unique: true,
	primaryKey: true,
	autoIncrement: true,
  })
  id: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_revoked: boolean; // аннулировать или нет

  @Column({ type: DataType.DATE, allowNull: false })
  expires: Date;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.INTEGER })
  user_id: number;

  // У одного refresh token может быть только один пользователь

  @BelongsTo(() => UserModel)
  user: UserModel;
}
