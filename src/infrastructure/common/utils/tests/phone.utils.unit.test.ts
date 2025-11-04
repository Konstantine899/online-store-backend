import {
    PHONE_CONSTANTS,
    cleanPhoneNumber,
    isRussianPhoneFormat,
    normalizeRussianPhone,
} from '../phone.utils';

describe('Phone Utils (unit)', () => {
    describe('PHONE_CONSTANTS', () => {
        it('должен содержать корректные константы для длин телефонных номеров', () => {
            expect(PHONE_CONSTANTS.RUSSIAN_PHONE_LENGTH).toBe(11);
            expect(PHONE_CONSTANTS.MIN_INTERNATIONAL_LENGTH).toBe(7);
            expect(PHONE_CONSTANTS.MAX_INTERNATIONAL_LENGTH).toBe(15);
            expect(PHONE_CONSTANTS.MAX_FORMATTED_LENGTH).toBe(20);
        });
    });

    describe('cleanPhoneNumber', () => {
        it('должен удалить пробелы, дефисы и скобки', () => {
            expect(cleanPhoneNumber('+7 (999) 123-45-67')).toBe('+79991234567');
            expect(cleanPhoneNumber('8-999-123-45-67')).toBe('89991234567');
            expect(cleanPhoneNumber('79991234567')).toBe('79991234567');
        });

        it('должен сохранить знак +', () => {
            expect(cleanPhoneNumber('+79991234567')).toBe('+79991234567');
            expect(cleanPhoneNumber('+375291234567')).toBe('+375291234567');
        });

        it('должен обработать уже очищенный номер', () => {
            expect(cleanPhoneNumber('79991234567')).toBe('79991234567');
            expect(cleanPhoneNumber('+79991234567')).toBe('+79991234567');
        });
    });

    describe('isRussianPhoneFormat', () => {
        it('должен вернуть true для российских номеров с 7', () => {
            expect(isRussianPhoneFormat('79161234567')).toBe(true);
            expect(isRussianPhoneFormat('79991234567')).toBe(true);
        });

        it('должен вернуть true для российских номеров с 8', () => {
            expect(isRussianPhoneFormat('89161234567')).toBe(true);
            expect(isRussianPhoneFormat('89991234567')).toBe(true);
        });

        it('должен вернуть false для номеров не 11 цифр', () => {
            expect(isRussianPhoneFormat('7916123456')).toBe(false); // 10 цифр
            expect(isRussianPhoneFormat('791612345678')).toBe(false); // 12 цифр
        });

        it('должен вернуть false для номеров, не начинающихся с 7 или 8', () => {
            expect(isRussianPhoneFormat('69161234567')).toBe(false);
            expect(isRussianPhoneFormat('99161234567')).toBe(false);
        });

        it('должен вернуть false для международных номеров', () => {
            expect(isRussianPhoneFormat('375291234567')).toBe(false); // 12 цифр
            expect(isRussianPhoneFormat('12345678901')).toBe(false); // 11 цифр, но не 7/8
        });
    });

    describe('normalizeRussianPhone', () => {
        it('должен нормализовать российский номер с 7 в +7', () => {
            expect(normalizeRussianPhone('79161234567')).toBe('+79161234567');
            expect(normalizeRussianPhone('79991234567')).toBe('+79991234567');
        });

        it('должен нормализовать российский номер с 8 в +7', () => {
            expect(normalizeRussianPhone('89161234567')).toBe('+79161234567');
            expect(normalizeRussianPhone('89991234567')).toBe('+79991234567');
        });

        it('должен вернуть номер как есть, если это не российский формат', () => {
            expect(normalizeRussianPhone('375291234567')).toBe('375291234567');
            expect(normalizeRussianPhone('12345678901')).toBe('12345678901');
            expect(normalizeRussianPhone('+79991234567')).toBe('+79991234567');
        });

        it('должен обработать номер с +', () => {
            // Номер с + уже в международном формате, не должен изменяться
            expect(normalizeRussianPhone('+79991234567')).toBe('+79991234567');
        });
    });
});
