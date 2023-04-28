import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { UserModel } from '../user/user.model';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'refresh_token',
  underscored: true,
  defaultScope: {
	attributes: { exclude: [`updatedAt`, `createdAt`] },
  },
})
export class RefreshTokenModel extends Model<RefreshTokenModel> {
  @ApiProperty({ example: 1, description: `Уникальный идентификатор` })
  @Column({
	type: DataType.INTEGER,
	unique: true,
	primaryKey: true,
	autoIncrement: true,
  })
  id: number;

  @ApiProperty({ example: false, description: `Отзыв refresh token` })
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_revoked: boolean; // аннулировать или нет

  @ApiProperty({
	example: `18.04.2023 9:50:01`,
	description: `Время жизни refresh token`,
  })
  @Column({ type: DataType.DATE, allowNull: false })
  expires: Date;

  @ApiProperty({
	example: 1,
	description: `Идентификатор пользователя которому принадлежит refresh token`,
  })
  @ForeignKey(() => UserModel)
  @Column({ type: DataType.INTEGER })
  user_id: number;

  // У одного refresh token может быть только один пользователь
  @ApiProperty({
	example: {
		id: 1,
		email: `test@mail.com`,
		password: `123456`,
	},
	description: `Пользователь`,
  })
  @BelongsTo(() => UserModel)
  user: UserModel;
}
