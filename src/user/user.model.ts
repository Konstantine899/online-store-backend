import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { Injectable } from '@nestjs/common';

interface IUserCreationAttributes {
  email: string;
  password: string;
}

@Injectable()
@Table({ tableName: 'user' })
export class UserModel extends Model<UserModel, IUserCreationAttributes> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ type: DataType.STRING, unique: true })
  email: string;

  @Column({ type: DataType.STRING })
  password: string;

  @Column({ type: DataType.STRING, defaultValue: 'USER' })
  role: string;
}
