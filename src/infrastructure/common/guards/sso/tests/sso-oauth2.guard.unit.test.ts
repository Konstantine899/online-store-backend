/**
 * Unit тесты для SSOOAuth2Guard
 * Покрывают делегирование в BaseSSOGuard
 *
 * Related to: SAAS-017-19, Этап 3.1
 */

import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SSOOAuth2Guard } from '../sso-oauth2.guard';

describe('SSOOAuth2Guard (unit)', () => {
    let guard: SSOOAuth2Guard;
    let mockContext: ExecutionContext;

    beforeEach(() => {
        guard = new SSOOAuth2Guard();
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
    // TESTS: handleRequest() - делегирование в BaseSSOGuard
    // ============================================================================

    describe('handleRequest', () => {
        it('должен делегировать обработку ошибок в BaseSSOGuard', () => {
            const error = new Error(
                "Cannot read properties of undefined (reading 'error')",
            );

            expect(() => {
                guard.handleRequest(error, null, undefined, mockContext);
            }).toThrow(UnauthorizedException);

            try {
                guard.handleRequest(error, null, undefined, mockContext);
            } catch (e) {
                expect((e as UnauthorizedException).message).toContain(
                    'State parameter',
                );
            }
        });

        it('должен возвращать пользователя при успешной аутентификации', () => {
            const user = { id: 1, email: 'user@example.com' };

            const result = guard.handleRequest(
                null,
                user,
                undefined,
                mockContext,
            );

            expect(result).toBe(user);
        });

        it('должен пробрасывать UnauthorizedException если пользователь отсутствует', () => {
            expect(() => {
                guard.handleRequest(null, null, 'User not found', mockContext);
            }).toThrow(UnauthorizedException);
        });
    });
});
