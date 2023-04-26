import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserModel } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleService } from '../role/role.service';
import { UserRepository } from './user.repository';
import { AddRoleDto } from './dto/add-role.dto';
import { RemoveRoleDto } from './dto/remove-role.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private roleService: RoleService,
  ) {}

  public async create(dto: CreateUserDto): Promise<UserModel> {
    const findEmail = await this.userRepository.findUserByEmail(dto.email);
    if (findEmail) {
      throw new BadRequestException(
        `Пользователь с таким email: ${dto.email} уже существует`,
      );
    }
    const user = await this.userRepository.createUser(dto);
    const role = await this.roleService.findRole('USER');
    if (!role) {
      this.notFound('Роль пользователя не найдена');
    }
    await user.$set('roles', [role.id]); // #set перезаписываю поле только в БД
    user.roles = [role]; // Добавляю roles в сам объект user
    await user.save();
    return this.userRepository.findUserByPkId(user.id);
  }

  public async findUserById(id: number): Promise<UserModel> {
    const user = this.userRepository.findUserById(id);
    if (!user) {
      this.notFound('Пользователь не найден');
    }
    return user;
  }

  public async findUserByEmail(email: string): Promise<UserModel> {
    return this.userRepository.findUserByEmail(email);
  }

  public async getListUsers(): Promise<UserModel[]> {
    return this.userRepository.findListUsers();
  }

  public async updateUser(id: number, dto: CreateUserDto): Promise<UserModel> {
    const user = await this.userRepository.updateUser(id, dto);
    const role = await this.roleService.findRole('USER');
    /* #set Потому что обновляется весь объект. Ищу роль пользователя и при обновлении перезаписываю поле*/
    await user.$set('roles', [role.id]);
    user.roles = [role];
    return user;
  }

  public async remove(id: number): Promise<number> {
    return this.userRepository.removeUser(id);
  }

  public async addRole(dto: AddRoleDto): Promise<unknown> {
    const user = await this.userRepository.findUserById(dto.userId);
    if (!user) {
      this.notFound(`Пользователь не найден в БД`);
    }
    const foundRole = await this.roleService.findRole(dto.role);
    if (!foundRole) {
      this.notFound(`Роль не найдена в БД`);
    }
    const addedRole = await user.$add('role', foundRole.id);
    if (!addedRole) {
      this.conflictException(
        `Данному пользователю уже присвоена роль ${foundRole.role}`,
      );
    }
    return addedRole;
  }

  public async removeRole(dto: RemoveRoleDto): Promise<number> {
    const user = await this.userRepository.findUserById(dto.userId);
    if (!user) this.notFound(`Пользователь не найден`);
    const foundRole = await this.roleService.findRole(dto.role);
    if (foundRole.role === 'USER') {
      this.forbiddenException('Удаление роли USER запрещено');
    }
    const removedRole: number = await user.$remove('role', foundRole.id);
    if (!removedRole) {
      this.notFound(
        `Роль ${foundRole.role} не принадлежит данному пользователю`,
      );
    }
    return removedRole;
  }

  private notFound(message: string): void {
    throw new NotFoundException({
      status: HttpStatus.NOT_FOUND,
      message,
    });
  }

  private conflictException(message: string): void {
    throw new ConflictException({
      status: HttpStatus.CONFLICT,
      message,
    });
  }

  private forbiddenException(message: string): void {
    throw new ForbiddenException({
      status: HttpStatus.FORBIDDEN,
      message,
    });
  }
}
