import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import {
    BadRequestException,
    ConflictException,
    NotFoundException,
    HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from '@app/infrastructure/repositories';
import { RoleService } from '../role/role.service';
import {
    CreateUserDto,
    AddRoleDto,
    RemoveRoleDto,
    UpdateUserDto,
} from '@app/infrastructure/dto';
import { UserModel, RoleModel } from '@app/domain/models';
import {
    GetUserResponse,
    UpdateUserResponse,
} from '@app/infrastructure/responses';
import { compare } from 'bcrypt';
jest.mock('bcrypt', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

type NamedError = Error & { name: string };

const mockUser: UserModel = {
    id: 1,
    email: 'test@example.com',
    password: '$2b$10$hashedPassword',
    roles: [
        { id: 1, role: 'USER', description: 'Пользователь' },
    ] as unknown as RoleModel[],
    refresh_tokens: [],
    products: [],
    orders: [],
} as unknown as UserModel;

const mockAdminUser: UserModel = {
    id: 2,
    email: 'kostay375298918971@gmail.com',
    password: '$2b$10$hashedPassword',
    roles: [
        { id: 2, role: 'ADMIN', description: 'Администратор' },
    ] as unknown as RoleModel[],
    refresh_tokens: [],
    products: [],
    orders: [],
} as unknown as UserModel;

const mockRole: RoleModel = {
    id: 1,
    role: 'USER',
    description: 'Пользователь',
} as unknown as RoleModel;

const mockAdminRole: RoleModel = {
    id: 2,
    role: 'ADMIN',
    description: 'Администратор',
} as unknown as RoleModel;

const validUserDto: CreateUserDto = {
    email: 'test@example.com',
    password: 'SecurePass123!',
};

const adminUserDto: CreateUserDto = {
    email: 'kostay375298918971@gmail.com',
    password: 'AdminPass123!',
};

const addRoleDto: AddRoleDto = {
    userId: 1,
    role: 'ADMIN',
};

const removeRoleDto: RemoveRoleDto = {
    userId: 1,
    role: 'USER',
};

describe('UserService', () => {
    let service: UserService;
    let userRepository: jest.Mocked<UserRepository>;
    let roleService: jest.Mocked<RoleService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: UserRepository,
                    useValue: {
                        findUserByEmail: jest.fn(),
                        createUser: jest.fn(),
                        findUser: jest.fn(),
                        findAuthenticatedUser: jest.fn(),
                        findListUsers: jest.fn(),
                        updateUser: jest.fn(),
                        updatePhone: jest.fn(),
                        removeUser: jest.fn(),
                        findRegisteredUser: jest.fn(),
                        findListUsersPaginated: jest.fn(),
                        findUserByPkId: jest.fn(),
                        updateFlags: jest.fn(),
                        updatePreferences: jest.fn(),
                        verifyEmail: jest.fn(),
                        verifyPhone: jest.fn(),
                        blockUser: jest.fn(),
                        unblockUser: jest.fn(),
                        suspendUser: jest.fn(),
                        unsuspendUser: jest.fn(),
                        softDeleteUser: jest.fn(),
                        restoreUser: jest.fn(),
                        upgradePremium: jest.fn(),
                        downgradePremium: jest.fn(),
                        setEmployee: jest.fn(),
                        unsetEmployee: jest.fn(),
                        setVip: jest.fn(),
                        unsetVip: jest.fn(),
                        setHighValue: jest.fn(),
                        unsetHighValue: jest.fn(),
                        setWholesale: jest.fn(),
                        unsetWholesale: jest.fn(),
                        setAffiliate: jest.fn(),
                        unsetAffiliate: jest.fn(),
                        requestVerificationCode: jest.fn(),
                        confirmVerificationCode: jest.fn(),
                    },
                },
                {
                    provide: RoleService,
                    useValue: {
                        getRole: jest.fn(),
                        createRole: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(UserModel),
                    useValue: {
                        findByPk: jest.fn(),
                        update: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        userRepository = module.get(UserRepository);
        roleService = module.get(RoleService);
    });

    describe('createUser', () => {
        it('должен успешно создать обычного пользователя', async () => {
            (userRepository.findUserByEmail as jest.Mock).mockResolvedValue(
                undefined,
            );
            roleService.getRole.mockResolvedValue(mockRole);
            userRepository.createUser.mockResolvedValue(mockUser);
            userRepository.findRegisteredUser.mockResolvedValue(mockUser);

            // Мокаем Sequelize методы
            const mockUserInstance = {
                ...mockUser,
                $set: jest.fn().mockResolvedValue(undefined),
                save: jest.fn().mockResolvedValue(mockUser),
                roles: [mockRole],
            };
            userRepository.createUser.mockResolvedValue(
                mockUserInstance as unknown as UserModel,
            );

            const result = await service.createUser(validUserDto);

            expect(result).toBe(mockUser);
            expect(userRepository.findUserByEmail).toHaveBeenCalledWith(
                validUserDto.email,
            );
            expect(roleService.getRole).toHaveBeenCalledWith('USER');
            expect(userRepository.createUser).toHaveBeenCalledWith(
                validUserDto,
            );
            // Роли привязываются через linkUserRole (приватный метод) —
            // проверяем ключевые вызовы и итоговый результат
            expect(userRepository.findUserByEmail).toHaveBeenCalledWith(validUserDto.email);
            expect(userRepository.findRegisteredUser).toHaveBeenCalledWith(mockUser.id);
        });

        it('должен создать пользователя с ADMIN ролью для специального email', async () => {
            (userRepository.findUserByEmail as jest.Mock).mockResolvedValue(
                null,
            );
            (roleService.getRole as jest.Mock).mockResolvedValue(null);
            roleService.createRole.mockResolvedValue(mockAdminRole);

            const mockUserInstance = {
                ...mockAdminUser,
                $set: jest.fn().mockResolvedValue(undefined),
                save: jest.fn().mockResolvedValue(mockAdminUser),
                roles: [mockAdminRole],
            };
            userRepository.createUser.mockResolvedValue(
                mockUserInstance as unknown as UserModel,
            );
            userRepository.findRegisteredUser.mockResolvedValue(mockAdminUser);

            const result = await service.createUser(adminUserDto);

            expect(result).toBe(mockAdminUser);
            expect(roleService.createRole).toHaveBeenCalledWith({
                role: 'ADMIN',
                description: 'Администратор',
            });
        });

        it('должен выбросить BadRequestException если пользователь уже существует', async () => {
            userRepository.findUserByEmail.mockResolvedValue(mockUser);

            await expect(service.createUser(validUserDto)).rejects.toThrow(
                new BadRequestException(
                    `Пользователь с таким email: ${validUserDto.email} уже существует`,
                ),
            );
        });
    });

    describe('getUser', () => {
        it('должен успешно получить пользователя по ID', async () => {
            userRepository.findUser.mockResolvedValue(mockUser);

            const result = await service.getUser(1);

            expect(result).toBe(mockUser);
            expect(userRepository.findUser).toHaveBeenCalledWith(1);
        });

        it('должен выбросить NotFoundException если пользователь не найден', async () => {
            (userRepository.findUser as jest.Mock).mockResolvedValue(null);

            await expect(service.getUser(999)).rejects.toThrow(
                new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    message: 'Пользователь не найден В БД',
                }),
            );
        });
    });

    describe('updateUser', () => {
        it('должен успешно обновить пользователя', async () => {
            const updatedUser = { ...mockUser, email: 'updated@example.com' };
            userRepository.findUser.mockResolvedValue(mockUser);
            (userRepository.findUserByEmail as jest.Mock).mockResolvedValue(
                null,
            );
            userRepository.updateUser.mockResolvedValue(
                updatedUser as unknown as UpdateUserResponse,
            );
            roleService.getRole.mockResolvedValue(mockRole);

            const mockUpdatedUserInstance = {
                ...updatedUser,
                $set: jest.fn().mockResolvedValue(undefined),
                roles: [mockRole],
            };
            userRepository.updateUser.mockResolvedValue(
                mockUpdatedUserInstance as unknown as UpdateUserResponse,
            );

            const result = await service.updateUser(1, {
                email: 'updated@example.com',
                password: 'NewPass123!',
            });

            expect(result).toBe(mockUpdatedUserInstance);
            expect(userRepository.findUser).toHaveBeenCalledWith(1);
            expect(userRepository.findUserByEmail).toHaveBeenCalledWith(
                'updated@example.com',
            );
        });

        it('должен выбросить NotFoundException если пользователь не найден', async () => {
            (userRepository.findUser as jest.Mock).mockResolvedValue(null);

            await expect(service.updateUser(999, validUserDto)).rejects.toThrow(
                new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    message: 'Пользователь с id: 999 не найден в БД',
                }),
            );
        });

        it('должен выбросить ConflictException если email уже используется', async () => {
            userRepository.findUser.mockResolvedValue(mockUser);
            userRepository.findUserByEmail.mockResolvedValue(mockUser);

            await expect(service.updateUser(1, validUserDto)).rejects.toThrow(
                new ConflictException({
                    status: HttpStatus.CONFLICT,
                    message: `Пользователь с таким email: ${validUserDto.email} уже существует`,
                }),
            );
        });

        it('должен выбросить ConflictException (409) если репозиторий вернул SequelizeUniqueConstraintError', async () => {
            userRepository.findUser.mockResolvedValue(mockUser);
            // email не найден на предварительной проверке, чтобы попасть в catch
            userRepository.findUserByEmail.mockResolvedValue(undefined as unknown as UserModel);
            const uniqueErr: NamedError = new Error('unique') as NamedError;
            uniqueErr.name = 'SequelizeUniqueConstraintError';
            userRepository.updateUser.mockRejectedValueOnce(uniqueErr);

            const dto: UpdateUserDto = { email: 'updated@example.com', password: 'NewPass123!' };
            await expect(service.updateUser(1, dto)).rejects.toThrow(
                new ConflictException({
                    status: HttpStatus.CONFLICT,
                    message: 'Пользователь с таким email: updated@example.com уже существует',
                }),
            );
        });
    });

    describe('removeUser', () => {
        it('должен успешно удалить пользователя', async () => {
            userRepository.findUser.mockResolvedValue(mockUser);
            roleService.getRole.mockResolvedValue(mockRole);
            (userRepository.removeUser as jest.Mock).mockResolvedValue(
                undefined,
            );

            const mockUserInstance = {
                ...mockUser,
                $remove: jest.fn().mockResolvedValue(undefined),
            };
            userRepository.findUser.mockResolvedValue(
                mockUserInstance as unknown as GetUserResponse,
            );

            const result = await service.removeUser(1);

            expect(result).toEqual({
                status: HttpStatus.OK,
                message: 'success',
            });
            expect(userRepository.findUser).toHaveBeenCalledWith(1);
            expect(userRepository.removeUser).toHaveBeenCalledWith(1);
        });

        it('должен выбросить NotFoundException если пользователь не найден', async () => {
            (userRepository.findUser as jest.Mock).mockResolvedValue(null);

            await expect(service.removeUser(999)).rejects.toThrow(
                new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    message: 'Пользователь не найден в БД',
                }),
            );
        });
    });

    describe('addRole', () => {
        it('должен успешно добавить роль пользователю', async () => {
            userRepository.findUser.mockResolvedValue(mockUser);
            roleService.getRole.mockResolvedValue(mockAdminRole);
            userRepository.findUser.mockResolvedValue(mockUser);

            const mockUserInstance = {
                ...mockUser,
                $add: jest.fn().mockResolvedValue(true),
            };
            userRepository.findUser.mockResolvedValue(
                mockUserInstance as unknown as GetUserResponse,
            );

            const result = await service.addRole(addRoleDto);

            expect(result).toBe(mockUserInstance);
            expect(userRepository.findUser).toHaveBeenCalledWith(
                addRoleDto.userId,
            );
            expect(roleService.getRole).toHaveBeenCalledWith(addRoleDto.role);
            // Привязка роли выполняется через linkUserRole (приватный метод);
            // проверяем, что повторная загрузка пользователя вызвана
            expect(userRepository.findUser).toHaveBeenCalledWith(mockUser.id);
        });

        it('должен выбросить NotFoundException если пользователь не найден', async () => {
            (userRepository.findUser as jest.Mock).mockResolvedValue(null);

            await expect(service.addRole(addRoleDto)).rejects.toThrow(
                new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    message: 'Пользователь не найден в БД',
                }),
            );
        });

        it('должен выбросить NotFoundException если роль не найдена', async () => {
            // Arrange
            userRepository.findUser.mockResolvedValue(mockUser);
            (roleService.getRole as jest.Mock).mockResolvedValue(null);

            // Act & Assert
            await expect(service.addRole(addRoleDto)).rejects.toThrow(
                new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    message: 'Роль не найдена в БД',
                }),
            );
        });

        it('должен выбросить ConflictException если роль уже присвоена', async () => {
            // Arrange
            userRepository.findUser.mockResolvedValue(mockUser);
            roleService.getRole.mockResolvedValue(mockAdminRole);

            // Роль уже существует — подменяем приватный метод isUserRoleExists
            (service as unknown as { isUserRoleExists: jest.Mock }).isUserRoleExists = jest.fn().mockResolvedValue(true);
            // Act & Assert
            await expect(service.addRole(addRoleDto)).rejects.toThrow(
                new ConflictException({
                    status: HttpStatus.CONFLICT,
                    message: `Данному пользователю уже присвоена роль ${mockAdminRole.role}`,
                }),
            );
        });
    });

    describe('removeUserRole', () => {
        it('должен успешно удалить роль у пользователя', async () => {
            userRepository.findUser.mockResolvedValue(mockUser);
            roleService.getRole.mockResolvedValue(mockRole);

            const mockUserInstance = {
                ...mockUser,
                $remove: jest.fn().mockResolvedValue(undefined),
            };
            userRepository.findUser.mockResolvedValue(
                mockUserInstance as unknown as GetUserResponse,
            );

            const result = await service.removeUserRole(removeRoleDto);

            expect(result).toEqual({
                status: HttpStatus.OK,
                message: 'success',
            });
            expect(userRepository.findUser).toHaveBeenCalledWith(
                removeRoleDto.userId,
            );
        });

        it('должен выбросить NotFoundException если пользователь не найден', async () => {
            (userRepository.findUser as jest.Mock).mockResolvedValue(null);

            await expect(service.removeUserRole(removeRoleDto)).rejects.toThrow(
                new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    message: 'Пользователь не найден в БД',
                }),
            );
        });
    });

    describe('findAuthenticatedUser', () => {
        it('должен успешно найти аутентифицированного пользователя', async () => {
            userRepository.findAuthenticatedUser.mockResolvedValue(mockUser);

            const result = await service.findAuthenticatedUser(1);

            expect(result).toBe(mockUser);
            expect(userRepository.findAuthenticatedUser).toHaveBeenCalledWith(
                1,
            );
        });
    });

    describe('checkUserAuth', () => {
        it('должен успешно проверить авторизацию пользователя', async () => {
            userRepository.findUser.mockResolvedValue(mockUser);

            const result = await service.checkUserAuth(1);

            expect(result).toBe(mockUser);
            expect(userRepository.findUser).toHaveBeenCalledWith(1);
        });

        it('должен выбросить NotFoundException если пользователь не найден', async () => {
            (userRepository.findUser as jest.Mock).mockResolvedValue(null);

            await expect(service.checkUserAuth(999)).rejects.toThrow(
                new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    message: 'Профиль пользователя не найден в БД',
                }),
            );
        });
    });

    describe('findUserByEmail', () => {
        it('должен успешно найти пользователя по email', async () => {
            userRepository.findUserByEmail.mockResolvedValue(mockUser);

            const result = await service.findUserByEmail('test@example.com');

            expect(result).toBe(mockUser);
            expect(userRepository.findUserByEmail).toHaveBeenCalledWith(
                'test@example.com',
            );
        });

        it('должен вернуть null если пользователь не найден', async () => {
            (userRepository.findUserByEmail as jest.Mock).mockResolvedValue(
                null,
            );

            const result = await service.findUserByEmail(
                'nonexistent@example.com',
            );

            expect(result).toBeNull();
        });
    });

    describe('getListUsers', () => {
        it('должен успешно получить список пользователей', async () => {
            const userList = [mockUser, mockAdminUser];
            const mockResponse = {
                data: userList,
                meta: {
                    totalCount: 2,
                    lastPage: 1,
                    currentPage: 1,
                    nextPage: 0,
                    previousPage: 0,
                    limit: 5
                }
            };
            userRepository.findListUsersPaginated.mockResolvedValue(mockResponse);

            const result = await service.getListUsers();

            expect(result).toEqual(mockResponse);
            expect(userRepository.findListUsersPaginated).toHaveBeenCalledWith(1, 5);
        });

        it('должен выбросить NotFoundException если список пуст', async () => {
            const emptyResponse = {
                data: [],
                meta: {
                    totalCount: 0,
                    lastPage: 0,
                    currentPage: 1,
                    nextPage: 0,
                    previousPage: 0,
                    limit: 5
                }
            };
            (
                userRepository.findListUsersPaginated as jest.Mock
            ).mockResolvedValue(emptyResponse);

            await expect(service.getListUsers()).rejects.toThrow('Список пользователей пуст');
        });
    });

    describe('createUser - дополнительные случаи', () => {
        it('должен создать роль USER если она не существует', async () => {
            (userRepository.findUserByEmail as jest.Mock).mockResolvedValue(
                null,
            );
            (roleService.getRole as jest.Mock).mockResolvedValue(null);
            roleService.createRole.mockResolvedValue(mockRole);

            const mockUserInstance = {
                ...mockUser,
                $set: jest.fn().mockResolvedValue(undefined),
                save: jest.fn().mockResolvedValue(mockUser),
                roles: [mockRole],
            };
            userRepository.createUser.mockResolvedValue(
                mockUserInstance as unknown as UserModel,
            );
            userRepository.findRegisteredUser.mockResolvedValue(mockUser);

            const result = await service.createUser(validUserDto);

            expect(result).toBe(mockUser);
            expect(roleService.createRole).toHaveBeenCalledWith({
                role: 'USER',
                description: 'Пользователь',
            });
        });
    });

    describe('updatePhone', () => {
        it('должен выбросить ConflictException если телефон уже используется', async () => {
            // Мокаем update так, чтобы он бросил уникальное ограничение
            const uniquePhoneErr: NamedError = new Error('unique') as NamedError;
            uniquePhoneErr.name = 'SequelizeUniqueConstraintError';
            (userRepository.updatePhone as jest.Mock).mockRejectedValueOnce(uniquePhoneErr);

            await expect(service.updatePhone(1, '+79990000001')).rejects.toThrow(
                new ConflictException({
                    status: HttpStatus.CONFLICT,
                    message: 'Такой номер телефона уже используется',
                }),
            );
        });
    });

    describe('updateFlags', () => {
        it('должен успешно обновить флаги пользователя', async () => {
            userRepository.updateFlags.mockResolvedValue(mockUser);
            const result = await service.updateFlags(1, { isActive: false });
            expect(result).toBe(mockUser);
            expect(userRepository.updateFlags).toHaveBeenCalledWith(1, { isActive: false });
        });

        it('должен выбросить NotFoundException если пользователь не найден', async () => {
            (userRepository.updateFlags as jest.Mock).mockResolvedValue(null);
            await expect(service.updateFlags(999, { isActive: true })).rejects.toThrow(
                new NotFoundException({ status: HttpStatus.NOT_FOUND, message: 'Пользователь не найден в БД' }),
            );
        });
    });

    describe('updatePreferences', () => {
        it('должен успешно обновить предпочтения пользователя', async () => {
            userRepository.updatePreferences.mockResolvedValue(mockUser);
            const result = await service.updatePreferences(1, { themePreference: 'dark' });
            expect(result).toBe(mockUser);
            expect(userRepository.updatePreferences).toHaveBeenCalledWith(1, { themePreference: 'dark' });
        });

        it('должен выбросить NotFoundException если пользователь не найден', async () => {
            (userRepository.updatePreferences as jest.Mock).mockResolvedValue(null);
            await expect(service.updatePreferences(999, { themePreference: 'dark' })).rejects.toThrow(
                new NotFoundException({ status: HttpStatus.NOT_FOUND, message: 'Пользователь не найден в БД' }),
            );
        });
    });

    describe('verifyEmailFlag / verifyPhoneFlag', () => {
        it('verifyEmailFlag: успешно', async () => {
            userRepository.verifyEmail.mockResolvedValue(mockUser);
            const result = await service.verifyEmailFlag(1);
            expect(result).toBe(mockUser);
            expect(userRepository.verifyEmail).toHaveBeenCalledWith(1);
        });
        it('verifyEmailFlag: 404', async () => {
            (userRepository.verifyEmail as jest.Mock).mockResolvedValue(null);
            await expect(service.verifyEmailFlag(999)).rejects.toThrow(
                new NotFoundException({ status: HttpStatus.NOT_FOUND, message: 'Пользователь не найден в БД' }),
            );
        });
        it('verifyPhoneFlag: успешно', async () => {
            userRepository.verifyPhone.mockResolvedValue(mockUser);
            const result = await service.verifyPhoneFlag(1);
            expect(result).toBe(mockUser);
            expect(userRepository.verifyPhone).toHaveBeenCalledWith(1);
        });
        it('verifyPhoneFlag: 404', async () => {
            (userRepository.verifyPhone as jest.Mock).mockResolvedValue(null);
            await expect(service.verifyPhoneFlag(999)).rejects.toThrow(
                new NotFoundException({ status: HttpStatus.NOT_FOUND, message: 'Пользователь не найден в БД' }),
            );
        });
    });

    describe('Admin actions: block/unblock', () => {
        it('blockUser: успешно', async () => {
            userRepository.blockUser.mockResolvedValue(mockUser);
            const result = await service.blockUser(1);
            expect(result).toBe(mockUser);
            expect(userRepository.blockUser).toHaveBeenCalledWith(1);
        });
        it('blockUser: 404', async () => {
            (userRepository.blockUser as jest.Mock).mockResolvedValue(null);
            await expect(service.blockUser(999)).rejects.toThrow(
                new NotFoundException({ status: HttpStatus.NOT_FOUND, message: 'Пользователь не найден в БД' }),
            );
        });
        it('unblockUser: успешно', async () => {
            userRepository.unblockUser.mockResolvedValue(mockUser);
            const result = await service.unblockUser(1);
            expect(result).toBe(mockUser);
            expect(userRepository.unblockUser).toHaveBeenCalledWith(1);
        });
        it('unblockUser: 404', async () => {
            (userRepository.unblockUser as jest.Mock).mockResolvedValue(null);
            await expect(service.unblockUser(999)).rejects.toThrow(
                new NotFoundException({ status: HttpStatus.NOT_FOUND, message: 'Пользователь не найден в БД' }),
            );
        });
    });

    describe('Admin actions: suspend/unsuspend', () => {
        it('suspendUser: успешно', async () => {
            userRepository.suspendUser.mockResolvedValue(mockUser);
            const result = await service.suspendUser(1);
            expect(result).toBe(mockUser);
            expect(userRepository.suspendUser).toHaveBeenCalledWith(1);
        });
        it('suspendUser: 404', async () => {
            (userRepository.suspendUser as jest.Mock).mockResolvedValue(null);
            await expect(service.suspendUser(999)).rejects.toThrow(
                new NotFoundException({ status: HttpStatus.NOT_FOUND, message: 'Пользователь не найден в БД' }),
            );
        });
        it('unsuspendUser: успешно', async () => {
            userRepository.unsuspendUser.mockResolvedValue(mockUser);
            const result = await service.unsuspendUser(1);
            expect(result).toBe(mockUser);
            expect(userRepository.unsuspendUser).toHaveBeenCalledWith(1);
        });
        it('unsuspendUser: 404', async () => {
            (userRepository.unsuspendUser as jest.Mock).mockResolvedValue(null);
            await expect(service.unsuspendUser(999)).rejects.toThrow(
                new NotFoundException({ status: HttpStatus.NOT_FOUND, message: 'Пользователь не найден в БД' }),
            );
        });
    });

    describe('changePassword', () => {
        it('404: пользователь не найден', async () => {
            (userRepository.findUserByPkId as jest.Mock).mockResolvedValue(null);
            await expect(service.changePassword(999, 'old', 'new')).rejects.toThrow(
                new NotFoundException({ status: HttpStatus.NOT_FOUND, message: 'Пользователь не найден в БД' }),
            );
        });

        it('400: неверный текущий пароль', async () => {
            (userRepository.findUserByPkId as jest.Mock).mockResolvedValue(mockUser);
            userRepository.findUserByEmail.mockResolvedValue({ ...mockUser, password: '$2b$10$hash' } as unknown as UserModel);
            (compare as unknown as jest.Mock).mockResolvedValue(false);
            await expect(service.changePassword(1, 'wrong-old', 'NewPass123!')).rejects.toThrow(
                new BadRequestException({ status: HttpStatus.BAD_REQUEST, message: 'Текущий пароль указан неверно' }),
            );
        });
    });

    describe('self-service verification', () => {
        it('requestVerificationCode: вызывает репозиторий с корректными аргументами', async () => {
            userRepository.requestVerificationCode.mockResolvedValue(undefined);
            await expect(service.requestVerificationCode(1, 'email')).resolves.toBeUndefined();
            expect(userRepository.requestVerificationCode).toHaveBeenCalledWith(1, 'email');
        });

        it('confirmVerificationCode: успех при true', async () => {
            userRepository.confirmVerificationCode.mockResolvedValue(true);
            await expect(service.confirmVerificationCode(1, 'phone', '123456')).resolves.toBeUndefined();
            expect(userRepository.confirmVerificationCode).toHaveBeenCalledWith(1, 'phone', '123456');
        });

        it('confirmVerificationCode: 400 при неверном/просроченном коде', async () => {
            userRepository.confirmVerificationCode.mockResolvedValue(false);
            await expect(service.confirmVerificationCode(1, 'email', 'bad'))
                .rejects
                .toThrow(new BadRequestException({ status: HttpStatus.BAD_REQUEST, message: 'Неверный или просроченный код подтверждения' }));
        });
    });
});
