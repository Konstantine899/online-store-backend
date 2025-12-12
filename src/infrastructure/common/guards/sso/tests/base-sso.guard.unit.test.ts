/**
 * Unit тесты для BaseSSOGuard
 * Покрывают обработку ошибок из Passport
 *
 * Related to: SAAS-017-19, Этап 3.1
 */

import {
    ExecutionContext,
    HttpException,
    UnauthorizedException,
} from '@nestjs/common';
import { BaseSSOGuard, IPassportError } from '../base-sso.guard';

// Создаем тестовый класс, наследующийся от BaseSSOGuard
class TestSSOGuard extends BaseSSOGuard {
    protected getStateParameterName(): string {
        return 'Test State Parameter';
    }
}

describe('BaseSSOGuard (unit)', () => {
    let guard: TestSSOGuard;
    let mockContext: ExecutionContext;

    beforeEach(() => {
        guard = new TestSSOGuard();
        mockContext = {
            switchToHttp: jest.fn(),
            getClass: jest.fn(),
            getHandler: jest.fn(),
            getArgs: jest.fn(),
            getArgByIndex: jest.fn(),
            getType: jest.fn(),
        } as unknown as ExecutionContext;
    });

    // ============================================================================
    // TESTS: handleRequest() - обработка ошибок
    // ============================================================================

    describe('handleRequest - обработка ошибок', () => {
        it('должен пробрасывать UnauthorizedException для ошибки "Cannot read properties of undefined (reading \'error\')"', () => {
            const error = new Error(
                "Cannot read properties of undefined (reading 'error')",
            );

            expect(() => {
                guard.handleRequest(error, null, undefined, mockContext);
            }).toThrow(UnauthorizedException);

            try {
                guard.handleRequest(error, null, undefined, mockContext);
            } catch (e) {
                expect(e).toBeInstanceOf(UnauthorizedException);
                expect((e as UnauthorizedException).message).toBe(
                    'Ошибка аутентификации: Test State Parameter отсутствует в callback',
                );
            }
        });

        it('должен пробрасывать UnauthorizedException для ошибки с "reading" и "error" и "undefined"', () => {
            const error = new Error('reading error undefined');

            expect(() => {
                guard.handleRequest(error, null, undefined, mockContext);
            }).toThrow(UnauthorizedException);
        });

        it('должен пробрасывать HttpException для ошибки с statusCode', () => {
            const error: IPassportError = new Error('Custom error') as IPassportError;
            error.statusCode = 403;
            error.response = { message: 'Forbidden' };

            expect(() => {
                guard.handleRequest(error, null, undefined, mockContext);
            }).toThrow(HttpException);

            try {
                guard.handleRequest(error, null, undefined, mockContext);
            } catch (e) {
                expect(e).toBeInstanceOf(HttpException);
                expect((e as HttpException).getStatus()).toBe(403);
            }
        });

        it('должен пробрасывать HttpException с message если response отсутствует', () => {
            const error: IPassportError = new Error('Custom error') as IPassportError;
            error.statusCode = 400;

            expect(() => {
                guard.handleRequest(error, null, undefined, mockContext);
            }).toThrow(HttpException);

            try {
                guard.handleRequest(error, null, undefined, mockContext);
            } catch (e) {
                expect(e).toBeInstanceOf(HttpException);
                expect((e as HttpException).getStatus()).toBe(400);
            }
        });

        it('должен пробрасывать UnauthorizedException для стандартной ошибки без statusCode', () => {
            const error = new Error('Standard error');

            expect(() => {
                guard.handleRequest(error, null, undefined, mockContext);
            }).toThrow(UnauthorizedException);

            try {
                guard.handleRequest(error, null, undefined, mockContext);
            } catch (e) {
                expect(e).toBeInstanceOf(UnauthorizedException);
                expect((e as UnauthorizedException).message).toBe('Standard error');
            }
        });

        it('должен обрабатывать ошибку без message', () => {
            const error = { toString: () => 'String error' } as unknown as Error;

            expect(() => {
                guard.handleRequest(error, null, undefined, mockContext);
            }).toThrow(UnauthorizedException);
        });
    });

    // ============================================================================
    // TESTS: handleRequest() - отсутствие пользователя
    // ============================================================================

    describe('handleRequest - отсутствие пользователя', () => {
        it('должен пробрасывать UnauthorizedException если пользователь отсутствует и info - Error', () => {
            const info = new Error('User not found');

            expect(() => {
                guard.handleRequest(null, null, info, mockContext);
            }).toThrow(UnauthorizedException);

            try {
                guard.handleRequest(null, null, info, mockContext);
            } catch (e) {
                expect(e).toBeInstanceOf(UnauthorizedException);
                expect((e as UnauthorizedException).message).toBe('User not found');
            }
        });

        it('должен пробрасывать UnauthorizedException если пользователь отсутствует и info - string', () => {
            const info = 'Authentication failed';

            expect(() => {
                guard.handleRequest(null, null, info, mockContext);
            }).toThrow(UnauthorizedException);

            try {
                guard.handleRequest(null, null, info, mockContext);
            } catch (e) {
                expect(e).toBeInstanceOf(UnauthorizedException);
                expect((e as UnauthorizedException).message).toBe(
                    'Authentication failed',
                );
            }
        });

        it('должен пробрасывать UnauthorizedException с дефолтным сообщением если info отсутствует', () => {
            expect(() => {
                guard.handleRequest(null, null, undefined, mockContext);
            }).toThrow(UnauthorizedException);

            try {
                guard.handleRequest(null, null, undefined, mockContext);
            } catch (e) {
                expect(e).toBeInstanceOf(UnauthorizedException);
                expect((e as UnauthorizedException).message).toBe(
                    'Аутентификация не удалась',
                );
            }
        });
    });

    // ============================================================================
    // TESTS: handleRequest() - успешная аутентификация
    // ============================================================================

    describe('handleRequest - успешная аутентификация', () => {
        it('должен возвращать пользователя если нет ошибок', () => {
            const user = { id: 1, email: 'user@example.com' };

            const result = guard.handleRequest(null, user, undefined, mockContext);

            expect(result).toBe(user);
        });

        it('должен возвращать пользователя даже если info присутствует', () => {
            const user = { id: 1, email: 'user@example.com' };
            const info = 'Some info';

            const result = guard.handleRequest(null, user, info, mockContext);

            expect(result).toBe(user);
        });
    });

    // ============================================================================
    // TESTS: getStateParameterName()
    // ============================================================================

    describe('getStateParameterName', () => {
        it('должен возвращать правильное имя параметра state', () => {
            // getStateParameterName - protected метод, проверяем через handleRequest
            const error = new Error(
                "Cannot read properties of undefined (reading 'error')",
            );

            try {
                guard.handleRequest(error, null, undefined, mockContext);
            } catch (e) {
                expect((e as UnauthorizedException).message).toContain(
                    'Test State Parameter',
                );
            }
        });
    });
});

