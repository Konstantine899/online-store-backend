import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { TokenService } from '../token/token.service';
import { CreateUserDto } from '@app/infrastructure/dto';
import { UserModel } from '@app/domain/models';
import {
    BadRequestException,
    HttpStatus,
    UnauthorizedException,
} from '@nestjs/common';

// ===== ТЕСТОВЫЕ ДАННЫЕ =====
import bcrypt from 'bcrypt';

const validUserDto: CreateUserDto = {
    email: 'test@example.com',
    password: 'SecurePass123!',
};

const adminUserDto: CreateUserDto = {
    email: 'kostay375298918971@gmail.com',
    password: 'AdminPass123!',
};

const mockUser: UserModel = {
    id: 1,
    email: 'test@example.com',
    password: '$2b$10$hashedPassword',
    roles: [{ role: 'USER' }],
    refresh_tokens: [],
    products: [],
    orders: [],
} as unknown as UserModel;

const mockAdminUser: UserModel = {
    id: 2,
    email: 'kostay375298918971@gmail.com',
    password: '$2b$10$hashedPassword',
    roles: [{ role: 'ADMIN' }],
    refresh_tokens: [],
    products: [],
    orders: [],
} as unknown as UserModel;

const mockAccessToken = 'mock.access.token';
const mockRefreshToken = 'mock.refresh.token';
const mockRequest = {
    headers: { authorization: 'Bearer mock.token' },
    signedCookies: {},
    cookies: {},
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe('AuthService', () => {
    let service: AuthService;
    let userService: jest.Mocked<UserService>;
    let tokenService: jest.Mocked<TokenService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UserService,
                    useValue: {
                        createUser: jest.fn(),
                        findUserByEmail: jest.fn(),
                        findAuthenticatedUser: jest.fn(),
                        updateLastLoginAt: jest.fn(),
                        logFailedLogin: jest.fn(),
                    },
                },
                {
                    provide: TokenService,
                    useValue: {
                        generateAccessToken: jest.fn(),
                        generateRefreshToken: jest.fn(),
                        decodeRefreshToken: jest.fn(),
                        removeRefreshToken: jest.fn(),
                        rotateRefreshToken: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get<AuthService>(AuthService);
        userService = module.get(UserService);
        tokenService = module.get(TokenService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('registration', () => {
        it('должен успешно зарегистрировать нового пользователя', async () => {
            // Arrange
            userService.createUser.mockResolvedValue(mockUser);
            tokenService.generateAccessToken.mockResolvedValue(mockAccessToken);
            tokenService.generateRefreshToken.mockResolvedValue(
                mockRefreshToken,
            );

            // Act
            const result = await service.registration(validUserDto);

            // Assert
            expect(result).toEqual({
                type: 'Bearer',
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
            });
            expect(userService.createUser).toHaveBeenCalledWith(validUserDto);
            expect(tokenService.generateAccessToken).toHaveBeenCalledWith(
                mockUser,
            );
            expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(
                mockUser,
                60 * 60 * 24 * 30,
            );
        });

        it('должен успешно зарегистрировать пользователя с ADMIN ролью для специального email', async () => {
            // Arrange
            userService.createUser.mockResolvedValue(mockAdminUser);
            tokenService.generateAccessToken.mockResolvedValue(mockAccessToken);
            tokenService.generateRefreshToken.mockResolvedValue(
                mockRefreshToken,
            );

            // Act
            const result = await service.registration(adminUserDto);

            // Assert
            expect(result).toEqual({
                type: 'Bearer',
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
            });
            expect(userService.createUser).toHaveBeenCalledWith(adminUserDto);
        });

        it('должен пробросить ошибку если UserService.createUser выбрасывает исключение', async () => {
            // Arrange
            const error = new BadRequestException(
                'Пользователь уже существует',
            );
            userService.createUser.mockRejectedValue(error);

            // Act & Assert
            await expect(service.registration(validUserDto)).rejects.toThrow(
                error,
            );
            expect(userService.createUser).toHaveBeenCalledWith(validUserDto);
        });

        it('должен пробросить ошибку если TokenService.generateAccessToken выбрасывает исключение', async () => {
            // Arrange
            userService.createUser.mockResolvedValue(mockUser);
            const error = new Error('Token generation failed');
            tokenService.generateAccessToken.mockRejectedValue(error);

            // Act & Assert
            await expect(service.registration(validUserDto)).rejects.toThrow(
                error,
            );
        });
    });

    describe('login', () => {
        beforeEach(() => {
            // Настройка bcrypt.compare для успешного сравнения паролей
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('должен успешно авторизовать пользователя с корректными данными', async () => {
            // Arrange
            userService.findUserByEmail.mockResolvedValue(mockUser);
            userService.findAuthenticatedUser.mockResolvedValue(mockUser);
            tokenService.generateAccessToken.mockResolvedValue(mockAccessToken);
            tokenService.generateRefreshToken.mockResolvedValue(
                mockRefreshToken,
            );

            // Act
            const result = await service.login(validUserDto);

            // Assert
            expect(result).toEqual({
                type: 'Bearer',
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
            });
            expect(userService.findUserByEmail).toHaveBeenCalledWith(
                validUserDto.email,
            );
            expect(userService.findAuthenticatedUser).toHaveBeenCalledWith(
                mockUser.id,
            );
        });

        it('должен выбросить UnauthorizedException для несуществующего email', async () => {
            // Arrange
            userService.findUserByEmail.mockResolvedValue(null as unknown as UserModel);

            // Act & Assert
            await expect(service.login(validUserDto)).rejects.toThrow(
                new UnauthorizedException({
                    status: HttpStatus.UNAUTHORIZED,
                    message: 'Не корректный email',
                }),
            );
            expect(userService.findUserByEmail).toHaveBeenCalledWith(
                validUserDto.email,
            );
        });

        it('должен выбросить UnauthorizedException для неверного пароля', async () => {
            // Arrange
            userService.findUserByEmail.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
            // Act & Assert
            await expect(service.login(validUserDto)).rejects.toThrow(
                new UnauthorizedException({
                    status: HttpStatus.UNAUTHORIZED,
                    message: 'Не корректный пароль',
                }),
            );
        });

        it('должен пробросить ошибку если TokenService.generateAccessToken выбрасывает исключение', async () => {
            // Arrange
            userService.findUserByEmail.mockResolvedValue(mockUser);
            userService.findAuthenticatedUser.mockResolvedValue(mockUser);
            const error = new Error('Token generation failed');
            tokenService.generateAccessToken.mockRejectedValue(error);

            // Act & Assert
            await expect(service.login(validUserDto)).rejects.toThrow(error);
        });
    });

    describe('logout', () => {
        const refreshDto = { refreshToken: mockRefreshToken };
        const mockPayload = { jti: 123, sub: mockUser.id, email: 'test@example.com'  };

        it('должен успешно выполнить logout', async () => {
            // Arrange
            tokenService.decodeRefreshToken.mockResolvedValue(mockPayload);
            tokenService.removeRefreshToken.mockResolvedValue(mockPayload.jti);

            // Act
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await service.logout(refreshDto, mockRequest as any);

            // Assert
            expect(result).toEqual({
                status: HttpStatus.OK,
                message: 'success',
            });
            expect(tokenService.decodeRefreshToken).toHaveBeenCalledWith(
                refreshDto.refreshToken,
            );
            expect(tokenService.removeRefreshToken).toHaveBeenCalledWith(
                mockPayload.jti,
                mockPayload.sub,
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((mockRequest as any).headers.authorization).toBeUndefined();
        });

        it('должен пробросить ошибку если TokenService.decodeRefreshToken выбрасывает исключение', async () => {
            // Arrange
            const error = new Error('Invalid token');
            tokenService.decodeRefreshToken.mockRejectedValue(error);

            // Act & Assert
            await expect(
                service.logout(refreshDto, mockRequest),
            ).rejects.toThrow(error);
        });

        it('должен пробросить ошибку если TokenService.removeRefreshToken выбрасывает исключение', async () => {
            // Arrange
            tokenService.decodeRefreshToken.mockResolvedValue(mockPayload);
            const error = new Error('Token removal failed');
            tokenService.removeRefreshToken.mockRejectedValue(error);

            // Act & Assert
            await expect(
                service.logout(refreshDto, mockRequest),
            ).rejects.toThrow(error);
        });
    });

    describe('updateAccessToken', () => {
        let consoleSpy: jest.SpyInstance;
        const mockRotateResult = {
            accessToken: 'new.access.token',
            refreshToken: 'new.refresh.token',
            user: mockUser
        };

        beforeEach(() => {
            consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        });

        afterEach(() => {
            consoleSpy.mockRestore();
        });

        it('должен успешно обновить access токен', async () => {
            // Arrange
            tokenService.rotateRefreshToken.mockResolvedValue(mockRotateResult);

            // Act
            const result = await service.updateAccessToken(mockRefreshToken);

            // Assert
            expect(result).toEqual({
                type: 'Bearer',
                accessToken: mockRotateResult.accessToken,
                refreshToken: mockRotateResult.refreshToken,
            });
            expect(tokenService.rotateRefreshToken).toHaveBeenCalledWith(
                mockRefreshToken,
            );
        });

        it('должен пробросить ошибку если TokenService.rotateRefreshToken выбрасывает исключение', async () => {
            // Arrange
            const error = new Error('Token rotation failed');
            tokenService.rotateRefreshToken.mockRejectedValue(error);

            // Act & Assert
            await expect(
                service.updateAccessToken(mockRefreshToken),
            ).rejects.toThrow(error);
        });

        it('должен логировать ошибку при неудачном обновлении токена', async () => {
            // Arrange
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();
            const error = new Error('Token rotation failed');
            tokenService.rotateRefreshToken.mockRejectedValue(error);

            // Act
            await expect(
                service.updateAccessToken(mockRefreshToken),
            ).rejects.toThrow(error);

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(
                'Token rotation failed:',
                error,
            );
            consoleSpy.mockRestore();
        });
    });

    describe('Edge cases', () => {
        it('должен обработать пустой email в DTO', async () => {
            const invalidDto = { email: '', password: 'ValidPass123!' };

            await expect(service.login(invalidDto)).rejects.toThrow();
        });

        it('должен обработать пустой пароль в DTO', async () => {
            const invalidDto = { email: 'test@example.com', password: '' };

            await expect(service.login(invalidDto)).rejects.toThrow();
        });

        it('должен обработать null значения в зависимостях', async () => {
            userService.findUserByEmail.mockResolvedValue(null as unknown as UserModel);

            await expect(service.login(validUserDto)).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });

    describe('getToken (private method)', () => {
        it('должен возвращать токен с refresh токеном', async () => {
            // Arrange
            userService.createUser.mockResolvedValue(mockUser);
            tokenService.generateAccessToken.mockResolvedValue(mockAccessToken);
            tokenService.generateRefreshToken.mockResolvedValue(
                mockRefreshToken,
            );

            // Act
            const result = await service.registration(validUserDto);

            // Assert
            expect(result).toHaveProperty('type', 'Bearer');
            expect(result).toHaveProperty('accessToken', mockAccessToken);
            expect(result).toHaveProperty('refreshToken', mockRefreshToken);
        });

        it('должен возвращать токен без refresh токена', async () => {
            // Arrange
            userService.findUserByEmail.mockResolvedValue(mockUser);
            userService.findAuthenticatedUser.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
            tokenService.generateAccessToken.mockResolvedValue(mockAccessToken);
            tokenService.generateRefreshToken.mockResolvedValue(
                mockRefreshToken,
            );

            // Act
            const result = await service.login(validUserDto);

            // Assert
            expect(result).toHaveProperty('type', 'Bearer');
            expect(result).toHaveProperty('accessToken', mockAccessToken);
            expect(result).toHaveProperty('refreshToken', mockRefreshToken);
        });
    });
});
