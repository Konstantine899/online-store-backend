import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { UserRoleModel } from '../role/user-role.model';
import { RoleModel } from '../role/role.model';
import { RefreshTokenModel } from '../token/refresh-token.model';
import { RatingModel } from '../rating/rating.model';
import { ProductModel } from '../product/product.model';
import { OrderModel } from '../order/order.model';
import { ApiProperty } from '@nestjs/swagger';

interface IUserCreationAttributes {
  email: string;
  password: string;
}

@Table({ tableName: 'user', underscored: true })
export class UserModel extends Model<UserModel, IUserCreationAttributes> {
  @ApiProperty({ example: 1, description: `Уникальный идентификатор` })
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number;

  @ApiProperty({
    example: `kostay375298918971@gmail.com`,
    description: `Электронный адрес пользователя`,
  })
  @Column({ type: DataType.STRING, unique: true })
  email: string;

  @ApiProperty({
    example: `123456`,
    description: `Пароль пользователя с минимальной длинной 6 символов`,
  })
  @Column({ type: DataType.STRING })
  password: string;

  @ApiProperty({
    example: { id: 1, role: ['USER'], description: `Пользователь` },
    description: `Роль пользователя`,
  })
  // Многие ко многим через промежуточную таблицу UserRoleModel
  @BelongsToMany(() => RoleModel, () => UserRoleModel)
  roles: RoleModel[];

  //У одного пользователя могут быть несколько refresh tokens
  @ApiProperty({
    example: {
      id: 1,
      is_revoked: false,
      expires: `18.04.2023 9:50:01`,
    },
    description: `Refresh tokens`,
  })
  @ApiProperty()
  @HasMany(() => RefreshTokenModel, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  refresh_tokens: RefreshTokenModel[];

  @ApiProperty({
    example: {
      id: 1,
      name: `Xiaomi Redmi 10 pro`,
      price: 2000,
      rating: 5,
      image: `1d8dc869-db93-4f80-8869-1ed92163c63d.jpg`,
    },
    description: `Продукт`,
  })
  @BelongsToMany(() => ProductModel, {
    through: () => RatingModel,
    onDelete: 'CASCADE',
  })
  products: ProductModel[];

  @ApiProperty({
    example: {
      id: 1,
      name: `Константин`,
      email: `kostay375298918971@gmail.com`,
      phone: `+375(29)891-89-71`,
      address: `г.Витебск ул.Чкалова к №1, дом №41, кв73`,
      amount: 2000,
      status: 0,
      comment: `Лучший телефон в мире`,
    },
    description: `Заказ`,
  })
  @HasMany(() => OrderModel, { onDelete: 'SET NULL' })
  orders: OrderModel[];
}
