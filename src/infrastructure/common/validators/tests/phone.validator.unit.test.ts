import { IsValidPhoneConstraint } from '@app/infrastructure/common/validators/phone.validator';

describe('IsValidPhoneConstraint (unit)', () => {
    // Оптимизация: создаём validator один раз для всех тестов
    const validator = new IsValidPhoneConstraint();

    // Оптимизация: тестовые данные вынесены в константы
    const validPhones = [
        '+79161234567', // российский с +7
        '+375291234567', // белорусский с +375
        '+7 916 123 45 67', // с пробелами
        '+375 29 123 45 67', // с пробелами
        '+7-916-123-45-67', // с дефисами
        '916-123-45-67', // с дефисами без +
        '+7(916)123-45-67', // со скобками
        '8(916)123-45-67', // со скобками
        '79161234567', // без +
        '375291234567', // без +
        '1234567', // минимум 7 цифр
        '+123456789012345', // максимум 15 цифр
        '123456789012345', // 15 цифр без +
        '+7 (916) 123-45-67', // нормализация
    ];

    const invalidShortPhones = ['123456', '+7123'];
    const invalidLongPhones = ['+1234567890123456'];
    const invalidWithLetters = ['+7916abc4567', 'phone123'];
    const invalidWithSpecialChars = [
        '+7916*123*45*67',
        '+7916#1234567',
        '+7916@1234567',
    ];

    describe('Валидные номера телефонов', () => {
        it('должен принять все валидные форматы номеров', () => {
            // Оптимизация: один тест вместо восьми
            validPhones.forEach((phone) => {
                expect(validator.validate(phone)).toBe(true);
            });
        });
    });

    describe('Невалидные номера телефонов', () => {
        it('должен отклонить номера короче 7 цифр', () => {
            invalidShortPhones.forEach((phone) => {
                expect(validator.validate(phone)).toBe(false);
            });
        });

        it('должен отклонить номера длиннее 15 цифр', () => {
            invalidLongPhones.forEach((phone) => {
                expect(validator.validate(phone)).toBe(false);
            });
        });

        it('должен отклонить номера с буквами', () => {
            invalidWithLetters.forEach((phone) => {
                expect(validator.validate(phone)).toBe(false);
            });
        });

        it('должен отклонить номера со спецсимволами', () => {
            invalidWithSpecialChars.forEach((phone) => {
                expect(validator.validate(phone)).toBe(false);
            });
        });

        it('должен отклонить невалидные входные данные', () => {
            // Оптимизация: объединяем пустую строку и не-строки
            expect(validator.validate('')).toBe(false);
            expect(validator.validate(123 as unknown as string)).toBe(false);
            expect(validator.validate(null as unknown as string)).toBe(false);
            expect(validator.validate(undefined as unknown as string)).toBe(
                false,
            );
        });
    });

    describe('Сообщение об ошибке', () => {
        it('должен вернуть корректное сообщение по умолчанию', () => {
            expect(validator.defaultMessage()).toBe(
                'Номер телефона должен содержать от 7 до 15 цифр и может начинаться с +',
            );
        });
    });
});
