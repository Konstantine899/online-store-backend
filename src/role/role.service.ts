import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RoleModel } from './role.model';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(RoleModel) private roleRepository: typeof RoleModel,
  ) {}

  async create(dto: CreateRoleDto): Promise<RoleModel> {
    const role = await this.roleRepository.create(dto);
    if (!role) {
      throw new HttpException(
        'Произошла не предвиденная ошибка',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return role;
  }

  async findOne(value: string): Promise<RoleModel> {
    const role = await this.roleRepository.findOne({ where: { value } });
    if (!role) {
      throw new NotFoundException('Не найдено');
    }
    return role;
  }
}
