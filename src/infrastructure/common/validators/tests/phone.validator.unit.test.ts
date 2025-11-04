import { IsValidPhoneConstraint } from '@app/infrastructure/common/validators/phone.validator';

describe('IsValidPhoneConstraint (unit)', () => {
    // Оптимизация: создаём validator один раз для всех тестов
    const validator = new IsValidPhoneConstraint();

    // Оптимизация: тестовые данные вынесены в константы
    const validRussianPhones = [
        '+79161234567', // российский с +7
        '+7 916 123 45 67', // с пробелами
        '+7-916-123-45-67', // с дефисами
        '+7(916)123-45-67', // со скобками
        '+7 (916) 123-45-67', // нормализация
        '79161234567', // без +, начинается с 7
        '89991234567', // начинается с 8
        '8 (999) 123-45-67', // с пробелами и скобками
        '7-999-123-45-67', // с дефисами
    ];

    const validInternationalPhones = [
        '+375291234567', // белорусский с +375
        '+375 29 123 45 67', // с пробелами
        '+123456789012345', // максимум 15 цифр (международный)
        '+1234567', // минимум 7 цифр (международный)
    ];

    const validPhones = [...validRussianPhones, ...validInternationalPhones];

    const invalidRussianPhones = [
        '9161234567', // 10 цифр, не 11
        '916-123-45-67', // 10 цифр после очистки
        '61234567890', // 11 цифр, но не начинается с 7 или 8
        '12345678901', // 11 цифр, но не начинается с 7 или 8
        '7999123456', // 10 цифр, не 11
        '8999123456', // 10 цифр, не 11
    ];

    const invalidShortPhones = ['123456', '+7123', '1234567']; // 7 цифр - не российский формат
    const invalidLongPhones = ['+1234567890123456', '799912345678901']; // слишком длинные
    const invalidWithLetters = ['+7916abc4567', 'phone123', '8999abc4567'];
    const invalidWithSpecialChars = [
        '+7916*123*45*67',
        '+7916#1234567',
        '+7916@1234567',
        '8916*123*45*67',
    ];
    const invalidInternationalPhones = [
        '123456789012345', // 15 цифр без + (не российский формат)
        '375291234567', // без +, не российский формат
    ];

    describe('Валидные номера телефонов', () => {
        it('должен принять все валидные российские форматы (+7, 8, 7)', () => {
            validRussianPhones.forEach((phone) => {
                expect(validator.validate(phone)).toBe(true);
            });
        });

        it('должен принять все валидные международные форматы', () => {
            validInternationalPhones.forEach((phone) => {
                expect(validator.validate(phone)).toBe(true);
            });
        });

        it('должен принять все валидные форматы номеров', () => {
            validPhones.forEach((phone) => {
                expect(validator.validate(phone)).toBe(true);
            });
        });
    });

    describe('Невалидные номера телефонов', () => {
        it('должен отклонить невалидные российские форматы', () => {
            invalidRussianPhones.forEach((phone) => {
                expect(validator.validate(phone)).toBe(false);
            });
        });

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

        it('должен отклонить невалидные международные форматы', () => {
            invalidInternationalPhones.forEach((phone) => {
                expect(validator.validate(phone)).toBe(false);
            });
        });

        it('должен отклонить невалидные входные данные', () => {
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
                'Номер телефона должен быть в формате: +7XXXXXXXXXX, 8XXXXXXXXXX, 7XXXXXXXXXX или международный формат',
            );
        });
    });
});
