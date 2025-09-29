import { InjectModel } from '@nestjs/sequelize';
import {
    BadRequestException,
    ConflictException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { UserModel } from '@app/domain/models';
import {
    CreateUserDto,
    AddRoleDto,
    RemoveRoleDto,
} from '@app/infrastructure/dto';
import { RoleService } from '../role/role.service';
import { UserRepository } from '@app/infrastructure/repositories';
import {
    CreateUserResponse,
    GetUserResponse,
    UpdateUserResponse,
    RemoveUserResponse,
    AddRoleResponse,
    RemoveUserRoleResponse,
    CheckResponse,
    GetPaginatedUsersResponse,
} from '@app/infrastructure/responses';
import { IUserService } from '@app/domain/services';

@Injectable()
export class UserService implements IUserService {
    constructor(
        private readonly userRepository: UserRepository,
        private roleService: RoleService,
        @InjectModel(UserModel) private readonly userModel: typeof UserModel,
    ) {}

    public async createUser(dto: CreateUserDto): Promise<CreateUserResponse> {
        const findEmail = await this.userRepository.findUserByEmail(dto.email);
        if (findEmail) {
            throw new BadRequestException(
                `Пользователь с таким email: ${dto.email} уже существует`,
            );
        }
        let role = await this.roleService.getRole('USER');
        if (dto.email === 'kostay375298918971@gmail.com') {
            role = await this.roleService.createRole({
                role: 'ADMIN',
                description: 'Администратор',
            });
        }
        if (!role) {
            role = await this.roleService.createRole({
                role: 'USER',
                description: 'Пользователь',
            });
        }
        const user = await this.userRepository.createUser(dto);
        await user.$set('roles', [role.id]); // #set перезаписываю поле только в БД
        user.roles = [role]; // Добавляю roles в сам объект user
        await user.save();
        return this.userRepository.findRegisteredUser(user.id);
    }

    public async findAuthenticatedUser(userId: number): Promise<UserModel> {
        return this.userRepository.findAuthenticatedUser(userId);
    }

    public async getUser(id: number): Promise<GetUserResponse> {
        const foundUser = await this.userRepository.findUser(id);
        if (!foundUser) {
            this.notFound('Пользователь не найден В БД');
        }
        return foundUser;
    }

    public async checkUserAuth(id: number): Promise<CheckResponse> {
        const user = await this.userRepository.findUser(id);
        if (!user) {
            this.notFound('Профиль пользователя не найден в БД');
        }
        return user;
    }

    public async findUserByEmail(email: string): Promise<UserModel> {
        return this.userRepository.findUserByEmail(email);
    }

    public async getListUsers(page: number = 1, limit: number = 5): Promise<GetPaginatedUsersResponse> {
        const listUsers = await this.userRepository.findListUsersPaginated(page, limit);
        if (!listUsers.data.length) {
            this.notFound('Список пользователей пуст');
        }
        return listUsers;
    }

    public async updateUser(
        id: number,
        dto: CreateUserDto,
    ): Promise<UpdateUserResponse> {
        const foundUser = await this.userRepository.findUser(id);
        if (!foundUser) {
            this.notFound(`Пользователь с id: ${id} не найден в БД`);
        }
        const foundEmail = await this.findUserByEmail(dto.email);
        if (foundEmail) {
            this.badRequest(
                `Пользователь с таким email: ${dto.email} уже существует`,
            );
        }
        const updatedUser = await this.userRepository.updateUser(
            foundUser,
            dto,
        );
        const role = await this.roleService.getRole('USER');
        /* #set Потому что обновляется весь объект. Ищу роль пользователя и при обновлении перезаписываю поле*/
        await updatedUser.$set('roles', [role.id]);
        updatedUser.roles = [role];
        return updatedUser;
    }

    public async removeUser(id: number): Promise<RemoveUserResponse> {
        const user = await this.userRepository.findUser(id);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        const roleId = await this.getRolesUser(user);
        await user.$remove('role', roleId!);
        await this.userRepository.removeUser(user.id);
        return {
            status: HttpStatus.OK,
            message: 'success',
        };
    }

    public async addRole(dto: AddRoleDto): Promise<AddRoleResponse> {
        const user = await this.userRepository.findUser(dto.userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        const foundRole = await this.roleService.getRole(dto.role);
        if (!foundRole) {
            this.notFound('Роль не найдена в БД');
        }
        const addedRole = await user.$add('role', foundRole.id);
        if (!addedRole) {
            this.conflictException(
                `Данному пользователю уже присвоена роль ${foundRole.role}`,
            );
        }
        return this.userRepository.findUser(user.id);
    }

    public async removeUserRole(
        dto: RemoveRoleDto,
    ): Promise<RemoveUserRoleResponse> {
        const user = await this.userRepository.findUser(dto.userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        const roleId = await this.getRolesUser(user);
        await user.$remove('role', roleId!);
        return {
            status: HttpStatus.OK,
            message: 'success',
        };
    }
    async updatePhone(userId: number, phone: string): Promise<UserModel> {
        const [updated] = await this.userModel.update(
            { phone },
            { where: { id: userId }, fields: ['phone'] },
        );
        
        if (!updated) {
            throw new NotFoundException('Пользователь не найден');
        }
        
        return this.userModel.findByPk(userId, { 
            attributes: ['id', 'email', 'phone'] 
        }) as Promise<UserModel>;
    }


//====================Другие методы===========================//
    protected async getRolesUser(user: UserModel): Promise<number | null> {
        const roles = user.roles.map((i) => i.role).join(',');
        const foundRole = await this.roleService.getRole(roles);
        if (!foundRole) {
            this.notFound('Роли пользователя не найдены в БД');
        }
        return foundRole.id;
    }

    private notFound(message: string): void {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }

    private badRequest(message: string): void {
        throw new BadRequestException({
            status: HttpStatus.BAD_REQUEST,
            message,
        });
    }

    private conflictException(message: string): void {
        throw new ConflictException({
            status: HttpStatus.CONFLICT,
            message,
        });
    }
}
