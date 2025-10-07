import { IsPasswordStrongConstraint } from '@app/infrastructure/common/validators/password-strength.validator';

describe('IsPasswordStrongConstraint (unit)', () => {
    // Оптимизация: создаём validator один раз для всех тестов
    const validator = new IsPasswordStrongConstraint();

    // Оптимизация: тестовые данные вынесены в константы (не пересоздаются)
    const validPasswords = [
        'MySecure123!',
        'P@ssw0rd',
        'Tr0ng#Pass',
        'Test123!@#',
        'Pass$123Word',
        'MyP@ss123',
        'VeryLongAndSecure123!Password',
        'Pass123!',
    ];

    const invalidShortPasswords = ['Short1!', 'Aa1!'];
    const invalidNoUppercase = ['password123!', 'mypass123!'];
    const invalidNoLowercase = ['PASSWORD123!', 'MYPASS123!'];
    const invalidNoDigits = ['MyPassword!', 'StrongPass!'];
    const invalidNoSpecial = ['MyPassword123', 'StrongPass123'];

    const commonPasswords = [
        'password',
        'Password',
        'PASSWORD',
        '123456',
        'qwerty',
        'Qwerty',
        'admin',
        'Admin',
        'password123',
        'Password123',
    ];

    describe('Валидные пароли', () => {
        it('должен принять все валидные пароли', () => {
            // Оптимизация: один тест вместо нескольких
            validPasswords.forEach((password) => {
                expect(validator.validate(password)).toBe(true);
            });
        });
    });

    describe('Слабые пароли (должны быть отклонены)', () => {
        it('должен отклонить пароль короче 8 символов', () => {
            invalidShortPasswords.forEach((password) => {
                expect(validator.validate(password)).toBe(false);
            });
        });

        it('должен отклонить пароль без заглавных букв', () => {
            invalidNoUppercase.forEach((password) => {
                expect(validator.validate(password)).toBe(false);
            });
        });

        it('должен отклонить пароль без строчных букв', () => {
            invalidNoLowercase.forEach((password) => {
                expect(validator.validate(password)).toBe(false);
            });
        });

        it('должен отклонить пароль без цифр', () => {
            invalidNoDigits.forEach((password) => {
                expect(validator.validate(password)).toBe(false);
            });
        });

        it('должен отклонить пароль без спецсимволов', () => {
            invalidNoSpecial.forEach((password) => {
                expect(validator.validate(password)).toBe(false);
            });
        });
    });

    describe('Простые/распространённые пароли', () => {
        it('должен отклонить все распространённые пароли', () => {
            // Оптимизация: один тест вместо пяти
            commonPasswords.forEach((password) => {
                expect(validator.validate(password)).toBe(false);
            });
        });
    });

    describe('Граничные случаи', () => {
        it('должен отклонить невалидные входные данные', () => {
            // Оптимизация: один тест для всех невалидных типов
            expect(validator.validate('')).toBe(false);
            expect(validator.validate(null as unknown as string)).toBe(false);
            expect(validator.validate(undefined as unknown as string)).toBe(
                false,
            );
        });

        it('должен принять пароль ровно 8 символов (минимум)', () => {
            expect(validator.validate('Pass123!')).toBe(true);
        });
    });

    describe('Сообщение об ошибке', () => {
        it('должен вернуть корректное сообщение по умолчанию', () => {
            expect(validator.defaultMessage()).toBe(
                'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные символы. Простые пароли запрещены.',
            );
        });
    });
});
