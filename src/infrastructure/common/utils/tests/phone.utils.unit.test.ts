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
        describe('Российские номера', () => {
            it('должен нормализовать российский номер с 7 в +7', () => {
                expect(normalizeRussianPhone('79161234567')).toBe('+79161234567');
                expect(normalizeRussianPhone('79991234567')).toBe('+79991234567');
            });

            it('должен нормализовать российский номер с 8 в +7', () => {
                expect(normalizeRussianPhone('89161234567')).toBe('+79161234567');
                expect(normalizeRussianPhone('89991234567')).toBe('+79991234567');
            });

            it('должен обработать граничные российские номера', () => {
                // Минимальный: 70000000000
                expect(normalizeRussianPhone('70000000000')).toBe('+70000000000');
                // Максимальный: 79999999999
                expect(normalizeRussianPhone('79999999999')).toBe('+79999999999');
                // С 8: минимальный 80000000000
                expect(normalizeRussianPhone('80000000000')).toBe('+70000000000');
                // С 8: максимальный 89999999999
                expect(normalizeRussianPhone('89999999999')).toBe('+79999999999');
            });
        });

        describe('Не-российские номера', () => {
            it('должен вернуть номер как есть, если это не российский формат', () => {
                expect(normalizeRussianPhone('375291234567')).toBe('375291234567');
                expect(normalizeRussianPhone('12345678901')).toBe('12345678901');
                expect(normalizeRussianPhone('+79991234567')).toBe('+79991234567');
            });

            it('должен обработать номер с +', () => {
                // Номер с + уже в международном формате, не должен изменяться
                expect(normalizeRussianPhone('+79991234567')).toBe('+79991234567');
            });

            it('должен вернуть короткие номера без изменений', () => {
                expect(normalizeRussianPhone('123456')).toBe('123456'); // 6 цифр
                expect(normalizeRussianPhone('7916123456')).toBe('7916123456'); // 10 цифр
            });

            it('должен вернуть длинные номера без изменений', () => {
                expect(normalizeRussianPhone('791612345678')).toBe('791612345678'); // 12 цифр
                expect(normalizeRussianPhone('79161234567890')).toBe('79161234567890'); // 14 цифр
            });
        });

        describe('Edge cases', () => {
            it('должен обработать пустую строку', () => {
                expect(normalizeRussianPhone('')).toBe('');
            });

            it('должен обработать номера, начинающиеся не с 7/8', () => {
                expect(normalizeRussianPhone('69161234567')).toBe('69161234567'); // Начинается с 6
                expect(normalizeRussianPhone('99161234567')).toBe('99161234567'); // Начинается с 9
            });

            it('должен обработать только цифры (без + префикса)', () => {
                expect(normalizeRussianPhone('79161234567')).toBe('+79161234567'); // Российский
                expect(normalizeRussianPhone('375291234567')).toBe('375291234567'); // Беларусь
                expect(normalizeRussianPhone('380991234567')).toBe('380991234567'); // Украина
            });
        });

        describe('Integration с cleanPhoneNumber', () => {
            it('должен корректно нормализовать после очистки форматирования', () => {
                // Очистка + нормализация
                expect(normalizeRussianPhone(cleanPhoneNumber('+7 (999) 123-45-67'))).toBe('+79991234567');
                expect(normalizeRussianPhone(cleanPhoneNumber('8-999-123-45-67').replace(/\D/g, ''))).toBe('+79991234567');
                expect(normalizeRussianPhone(cleanPhoneNumber('+7 916 123 45 67'))).toBe('+79161234567');
            });
        });
    });
});
