import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
    NotFoundException,
    UnprocessableEntityException,
    HttpStatus,
} from '@nestjs/common';
import { TokenExpiredError } from 'jsonwebtoken';
import { TokenService } from './token.service';
import {
    RefreshTokenRepository,
    UserRepository,
} from '@app/infrastructure/repositories';
import { RefreshTokenModel, UserModel, RoleModel } from '@app/domain/models';
import {
    IRefreshTokenPayload,
    IAccessTokenPayload,
} from '@app/domain/services';
import { IDecodedAccessToken } from '@app/domain/jwt';

const mockUser: UserModel = {
    id: 1,
    email: 'test@example.com',
    password: '$2b$10$hashedPassword',
    roles: [{ role: 'USER' }] as unknown as RoleModel[],
    refresh_tokens: [],
    products: [],
    orders: [],
} as unknown as UserModel;

const mockRefreshToken: RefreshTokenModel = {
    id: 1,
    user_id: 1,
    token: 'hashed.refresh.token',
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
    created_at: new Date(),
    updated_at: new Date(),
} as unknown as RefreshTokenModel;

const mockAccessTokenPayload: IAccessTokenPayload = {
    id: 1,
    roles: [{ role: 'USER' }] as unknown as RoleModel[],
};

const mockRefreshTokenPayload: IRefreshTokenPayload = {
    sub: 1,
    email: 'test@example.com',
    jti: 1,
};

const mockDecodedAccessToken: IDecodedAccessToken = {
    id: 1,
    roles: [{ role: 'USER' }] as unknown as RoleModel[],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: '1',
};

const mockAccessToken = 'mock.access.token';
const mockRefreshTokenString = 'mock.refresh.token';
const mockRequest = {
    user: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe('TokenService', () => {
    let service: TokenService;
    let jwtService: jest.Mocked<JwtService>;
    let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
    let userRepository: jest.Mocked<UserRepository>;

    beforeAll(() => {
        process.env.NODE_ENV = 'test';
        process.env.COOKIE_PARSER_SECRET_KEY = 'test-secret-please-change';
        process.env.JWT_ACCESS_SECRET =
            'access-secret-please-change-32chars-minimum';
        process.env.JWT_REFRESH_SECRET =
            'refresh-secret-please-change-32chars-minimum';
        process.env.JWT_ACCESS_TTL = '900s';
        process.env.JWT_REFRESH_TTL = '30d';
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TokenService,
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: jest.fn(),
                        verifyAsync: jest.fn(),
                        decode: jest.fn(),
                    },
                },
                {
                    provide: RefreshTokenRepository,
                    useValue: {
                        createRefreshToken: jest.fn(),
                        findRefreshTokenById: jest.fn(),
                        findListRefreshTokens: jest.fn(),
                        removeRefreshToken: jest.fn(),
                        removeListRefreshTokens: jest.fn(),
                    },
                },
                {
                    provide: UserRepository,
                    useValue: {
                        findUser: jest.fn(),
                        findUserByPkId: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TokenService>(TokenService);
        jwtService = module.get(JwtService);
        refreshTokenRepository = module.get(RefreshTokenRepository);
        userRepository = module.get(UserRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateAccessToken', () => {
        it('должен успешно сгенерировать access токен', async () => {
            jwtService.signAsync.mockResolvedValue(mockAccessToken);

            const result = await service.generateAccessToken(mockUser);

            expect(result).toBe(mockAccessToken);
            expect(jwtService.signAsync).toHaveBeenCalledWith(
                mockAccessTokenPayload,
                { subject: String(mockUser.id) },
            );
        });

        it('должен пробросить ошибку если JwtService.signAsync выбрасывает исключение', async () => {
            const error = new Error('JWT signing failed');
            jwtService.signAsync.mockRejectedValue(error);

            await expect(service.generateAccessToken(mockUser)).rejects.toThrow(
                error,
            );
        });
    });

    describe('generateRefreshToken', () => {
        it('должен успешно сгенерировать refresh токен', async () => {
            refreshTokenRepository.createRefreshToken.mockResolvedValue(
                mockRefreshToken,
            );
            jwtService.signAsync.mockResolvedValue(mockRefreshTokenString);

            const result = await service.generateRefreshToken(mockUser, 3600);

            expect(result).toBe(mockRefreshTokenString);
            expect(
                refreshTokenRepository.createRefreshToken,
            ).toHaveBeenCalledWith(mockUser, 3600);
            expect(jwtService.signAsync).toHaveBeenCalledWith(
                {},
                expect.objectContaining({
                    subject: String(mockUser.id),
                    jwtid: String(mockRefreshToken.id),
                    secret: expect.any(String),
                }),
            );
        });

        it('должен пробросить ошибку если RefreshTokenRepository.createRefreshToken выбрасывает исключение', async () => {
            const error = new Error('Database error');
            refreshTokenRepository.createRefreshToken.mockRejectedValue(error);

            await expect(
                service.generateRefreshToken(mockUser, 3600),
            ).rejects.toThrow(error);
        });

        it('должен пробросить ошибку если JwtService.signAsync выбрасывает исключение', async () => {
            refreshTokenRepository.createRefreshToken.mockResolvedValue(
                mockRefreshToken,
            );
            const error = new Error('JWT signing failed');
            jwtService.signAsync.mockRejectedValue(error);

            await expect(
                service.generateRefreshToken(mockUser, 3600),
            ).rejects.toThrow(error);
        });
    });

    describe('decodeRefreshToken', () => {
        it('должен успешно декодировать валидный refresh токен', async () => {
            jwtService.verifyAsync.mockResolvedValue(mockRefreshTokenPayload);

            const result = await service.decodeRefreshToken(
                mockRefreshTokenString,
            );

            expect(result).toEqual(mockRefreshTokenPayload);
            expect(jwtService.verifyAsync).toHaveBeenCalledWith(
                mockRefreshTokenString,
                expect.objectContaining({ secret: expect.any(String) }),
            );
        });

        it('должен выбросить UnprocessableEntityException для истекшего токена', async () => {
            const expiredError = new TokenExpiredError(
                'Token expired',
                new Date(),
            );
            jwtService.verifyAsync.mockRejectedValue(expiredError);

            await expect(
                service.decodeRefreshToken(mockRefreshTokenString),
            ).rejects.toThrow(
                new UnprocessableEntityException(
                    'Срок действия refresh token истек',
                ),
            );
        });

        it('должен выбросить UnprocessableEntityException для неверного формата токена', async () => {
            const invalidError = new Error('Invalid token');
            jwtService.verifyAsync.mockRejectedValue(invalidError);

            await expect(
                service.decodeRefreshToken(mockRefreshTokenString),
            ).rejects.toThrow(
                new UnprocessableEntityException(
                    'Не верный формат refresh token',
                ),
            );
        });
    });

    describe('getUserFromRefreshTokenPayload', () => {
        it('должен успешно получить пользователя из payload', async () => {
            userRepository.findUser.mockResolvedValue(mockUser);

            const result = await service.getUserFromRefreshTokenPayload(
                mockRefreshTokenPayload,
            );

            expect(result).toBe(mockUser);
            expect(userRepository.findUser).toHaveBeenCalledWith(
                mockRefreshTokenPayload.sub,
            );
        });

        it('должен выбросить UnprocessableEntityException для отсутствующего subject', async () => {
            const invalidPayload = {
                ...mockRefreshTokenPayload,
                sub: undefined,
            };

            await expect(
                service.getUserFromRefreshTokenPayload(
                    invalidPayload as unknown as IRefreshTokenPayload,
                ),
            ).rejects.toThrow(
                new UnprocessableEntityException(
                    'Не верный формат refresh token',
                ),
            );
        });

        it('должен пробросить ошибку если UserRepository.findUser выбрасывает исключение', async () => {
            const error = new Error('Database error');
            userRepository.findUser.mockRejectedValue(error);

            await expect(
                service.getUserFromRefreshTokenPayload(mockRefreshTokenPayload),
            ).rejects.toThrow(error);
        });
    });

    describe('getStoredRefreshTokenFromRefreshTokenPayload', () => {
        it('должен успешно получить сохраненный refresh токен', async () => {
            refreshTokenRepository.findRefreshTokenById.mockResolvedValue(
                mockRefreshToken,
            );

            const result =
                await service.getStoredRefreshTokenFromRefreshTokenPayload(
                    mockRefreshTokenPayload,
                );

            expect(result).toBe(mockRefreshToken);
            expect(
                refreshTokenRepository.findRefreshTokenById,
            ).toHaveBeenCalledWith(mockRefreshTokenPayload.jti);
        });

        it('должен выбросить UnprocessableEntityException для отсутствующего jti', async () => {
            const invalidPayload = {
                ...mockRefreshTokenPayload,
                jti: undefined,
            };

            await expect(
                service.getStoredRefreshTokenFromRefreshTokenPayload(
                    invalidPayload as unknown as IRefreshTokenPayload,
                ),
            ).rejects.toThrow(
                new UnprocessableEntityException(
                    'id refresh token не получен из payload',
                ),
            );
        });

        it('должен вернуть null если токен не найден', async () => {
            refreshTokenRepository.findRefreshTokenById.mockResolvedValue(null);

            const result =
                await service.getStoredRefreshTokenFromRefreshTokenPayload(
                    mockRefreshTokenPayload,
                );

            expect(result).toBeNull();
        });
    });

    describe('decodedAccessToken', () => {
        it('должен успешно декодировать access токен', async () => {
            jwtService.verifyAsync.mockResolvedValue(mockDecodedAccessToken);

            const result = await service.decodedAccessToken(
                mockAccessToken,
                mockRequest,
            );

            expect(result).toEqual(mockDecodedAccessToken);
            expect(mockRequest.user).toBe(mockDecodedAccessToken);
            expect(jwtService.verifyAsync).toHaveBeenCalledWith(
                mockAccessToken,
                {
                    secret: expect.any(String),
                },
            );
        });

        it('должен пробросить ошибку если JwtService.verifyAsync выбрасывает исключение', async () => {
            const error = new Error('JWT verification failed');
            jwtService.verifyAsync.mockRejectedValue(error);

            await expect(
                service.decodedAccessToken(mockAccessToken, mockRequest),
            ).rejects.toThrow(error);
        });
    });

    describe('updateRefreshToken', () => {
        it('должен успешно обновить refresh токен', async () => {
            jwtService.verifyAsync.mockResolvedValue(mockRefreshTokenPayload);
            refreshTokenRepository.findRefreshTokenById.mockResolvedValue(
                mockRefreshToken,
            );
            userRepository.findUser.mockResolvedValue(mockUser);

            const result = await service.updateRefreshToken(
                mockRefreshTokenString,
            );

            expect(result).toEqual({
                user: mockUser,
                refreshToken: mockRefreshToken,
            });
        });

        it('должен выбросить NotFoundException если refresh токен не найден', async () => {
            jwtService.verifyAsync.mockResolvedValue(mockRefreshTokenPayload);
            refreshTokenRepository.findRefreshTokenById.mockResolvedValue(null);

            await expect(
                service.updateRefreshToken(mockRefreshTokenString),
            ).rejects.toThrow(
                new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    message: 'Refresh token не найден в БД',
                }),
            );
        });

        it('должен выбросить UnprocessableEntityException если пользователь не найден', async () => {
            jwtService.verifyAsync.mockResolvedValue(mockRefreshTokenPayload);
            refreshTokenRepository.findRefreshTokenById.mockResolvedValue(
                mockRefreshToken,
            );
            userRepository.findUser.mockResolvedValue(
                null as unknown as UserModel,
            );

            await expect(
                service.updateRefreshToken(mockRefreshTokenString),
            ).rejects.toThrow(
                new UnprocessableEntityException(
                    'Не верный формат refresh token',
                ),
            );
        });
    });

    describe('createAccessTokenFromRefreshToken', () => {
        it('должен успешно создать access токен из refresh токена', async () => {
            jwtService.verifyAsync.mockResolvedValue(mockRefreshTokenPayload);
            refreshTokenRepository.findRefreshTokenById.mockResolvedValue(
                mockRefreshToken,
            );
            userRepository.findUser.mockResolvedValue(mockUser);
            jwtService.signAsync.mockResolvedValue(mockAccessToken);

            const result = await service.createAccessTokenFromRefreshToken(
                mockRefreshTokenString,
            );

            expect(result).toEqual({
                accessToken: mockAccessToken,
                user: mockUser,
            });
        });
    });

    describe('hashRefreshToken', () => {
        it('должен успешно захешировать refresh токен', () => {
            const originalToken = 'original.refresh.token';

            const result = service.hashRefreshToken(originalToken);

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('getRefreshExpiresAt', () => {
        it('должен успешно получить дату истечения токена', () => {
            const expTime = Math.floor(Date.now() / 1000) + 3600;
            const decodedToken = { exp: expTime };
            jwtService.decode.mockReturnValue(decodedToken);

            const result = service.getRefreshExpiresAt(mockRefreshTokenString);

            expect(result).toEqual(new Date(expTime * 1000));
        });

        it('должен вернуть undefined если токен не содержит exp', () => {
            jwtService.decode.mockReturnValue({});

            const result = service.getRefreshExpiresAt(mockRefreshTokenString);

            expect(result).toBeUndefined();
        });

        it('должен вернуть undefined если токен невалидный', () => {
            jwtService.decode.mockReturnValue(null);

            const result = service.getRefreshExpiresAt(mockRefreshTokenString);

            expect(result).toBeUndefined();
        });
    });

    describe('removeRefreshToken', () => {
        it('должен удалить единственный refresh токен', async () => {
            refreshTokenRepository.findListRefreshTokens.mockResolvedValue([
                mockRefreshToken,
            ]);
            refreshTokenRepository.removeRefreshToken.mockResolvedValue(1);

            const result = await service.removeRefreshToken(1, 1);

            expect(result).toBe(1);
            expect(
                refreshTokenRepository.removeRefreshToken,
            ).toHaveBeenCalledWith(1);
        });

        it('должен удалить все refresh токены если их больше одного', async () => {
            const multipleTokens = [
                mockRefreshToken,
                { ...mockRefreshToken, id: 2 },
            ] as unknown as RefreshTokenModel[];
            refreshTokenRepository.findListRefreshTokens.mockResolvedValue(
                multipleTokens,
            );
            refreshTokenRepository.removeListRefreshTokens.mockResolvedValue(2);

            const result = await service.removeRefreshToken(1, 1);

            expect(result).toBe(2);
            expect(
                refreshTokenRepository.removeListRefreshTokens,
            ).toHaveBeenCalledWith(1);
        });
    });

    describe('rotateRefreshToken', () => {
        it('должен успешно ротировать refresh токен', async () => {
            jwtService.verifyAsync.mockResolvedValue(mockRefreshTokenPayload);
            refreshTokenRepository.findRefreshTokenById.mockResolvedValue(
                mockRefreshToken,
            );
            userRepository.findUserByPkId.mockResolvedValue(mockUser);
            refreshTokenRepository.createRefreshToken.mockResolvedValue(
                mockRefreshToken,
            );
            jwtService.signAsync
                .mockResolvedValueOnce(mockRefreshTokenString)
                .mockResolvedValueOnce(mockAccessToken);
            const result = await service.rotateRefreshToken(
                mockRefreshTokenString,
            );

            expect(result).toEqual({
                accessToken: mockAccessToken,
                refreshToken: mockRefreshTokenString,
                user: mockUser,
            });
        });

        it('должен выбросить NotFoundException если токен не найден', async () => {
            jwtService.verifyAsync.mockResolvedValue(mockRefreshTokenPayload);
            refreshTokenRepository.findRefreshTokenById.mockResolvedValue(null);
            refreshTokenRepository.removeListRefreshTokens.mockResolvedValue(0);

            await expect(
                service.rotateRefreshToken(mockRefreshTokenString),
            ).rejects.toThrow(
                new NotFoundException(
                    'Refresh token not found or already used (possible theft detected)',
                ),
            );
        });

        it('должен выбросить UnprocessableEntityException если пользователь токена не совпадает', async () => {
            const wrongUserToken = {
                ...mockRefreshToken,
                user_id: 999,
            } as unknown as RefreshTokenModel;
            jwtService.verifyAsync.mockResolvedValue(mockRefreshTokenPayload);
            refreshTokenRepository.findRefreshTokenById.mockResolvedValue(
                wrongUserToken,
            );

            await expect(
                service.rotateRefreshToken(mockRefreshTokenString),
            ).rejects.toThrow(
                new UnprocessableEntityException('Token user mismatch'),
            );
        });

        it('должен выбросить UnprocessableEntityException если токен истек', async () => {
            const expiredToken = {
                ...mockRefreshToken,
                expires: new Date(Date.now() - 1000),
            } as unknown as RefreshTokenModel;
            jwtService.verifyAsync.mockResolvedValue(mockRefreshTokenPayload);
            refreshTokenRepository.findRefreshTokenById.mockResolvedValue(
                expiredToken,
            );

            await expect(
                service.rotateRefreshToken(mockRefreshTokenString),
            ).rejects.toThrow(
                new UnprocessableEntityException('Refresh token expired'),
            );
        });
    });
});
