import { IsValidNameConstraint } from '@app/infrastructure/common/validators/name.validator';

describe('IsValidNameConstraint (unit)', () => {
    let validator: IsValidNameConstraint;

    beforeEach(() => {
        validator = new IsValidNameConstraint();
    });

    describe('Валидные имена', () => {
        it('должен принять простое русское имя', () => {
            expect(validator.validate('Иван')).toBe(true);
            expect(validator.validate('Мария')).toBe(true);
        });

        it('должен принять простое английское имя', () => {
            expect(validator.validate('John')).toBe(true);
            expect(validator.validate('Mary')).toBe(true);
        });

        it('должен принять имя с дефисом', () => {
            expect(validator.validate('Анна-Мария')).toBe(true);
            expect(validator.validate('Jean-Claude')).toBe(true);
        });

        it('должен принять имя с апострофом', () => {
            expect(validator.validate("O'Connor")).toBe(true);
            expect(validator.validate("D'Artagnan")).toBe(true);
        });

        it('должен принять полное ФИО', () => {
            expect(validator.validate('Иванов Иван Иванович')).toBe(true);
            expect(validator.validate('John Michael Smith')).toBe(true);
        });

        it('должен принять имя с пробелами по краям (trimmed)', () => {
            expect(validator.validate('  Иван  ')).toBe(true);
        });

        it('должен принять имя длиной от 2 до 100 символов', () => {
            expect(validator.validate('Ли')).toBe(true); // 2 символа
            expect(validator.validate('А'.repeat(100))).toBe(true); // 100 символов
        });
    });

    describe('Невалидные имена', () => {
        it('должен отклонить имя короче 2 символов', () => {
            expect(validator.validate('А')).toBe(false);
            expect(validator.validate('I')).toBe(false);
        });

        it('должен отклонить имя длиннее 100 символов', () => {
            expect(validator.validate('А'.repeat(101))).toBe(false);
        });

        it('должен отклонить имя с цифрами', () => {
            expect(validator.validate('Иван123')).toBe(false);
            expect(validator.validate('John123')).toBe(false);
        });

        it('должен отклонить имя со спецсимволами (кроме дефис и апостроф)', () => {
            expect(validator.validate('Иван@mail')).toBe(false);
            expect(validator.validate('John#123')).toBe(false);
            expect(validator.validate('Мария!')).toBe(false);
        });

        it('должен отклонить HTML-теги', () => {
            expect(validator.validate('<script>alert(1)</script>')).toBe(false);
            expect(validator.validate('Иван<br>Иванов')).toBe(false);
        });

        it('должен отклонить пустую строку', () => {
            expect(validator.validate('')).toBe(false);
        });

        it('должен отклонить строку только из пробелов', () => {
            expect(validator.validate('   ')).toBe(false);
        });

        it('должен отклонить не-строку', () => {
            expect(validator.validate(123 as unknown as string)).toBe(false);
            expect(validator.validate(null as unknown as string)).toBe(false);
            expect(validator.validate(undefined as unknown as string)).toBe(
                false,
            );
        });
    });

    describe('Граничные случаи', () => {
        it('должен принять имя ровно 2 символа (минимум)', () => {
            expect(validator.validate('Ли')).toBe(true);
            expect(validator.validate('Li')).toBe(true);
        });

        it('должен принять имя ровно 100 символов (максимум)', () => {
            const longName = 'А'.repeat(100);
            expect(validator.validate(longName)).toBe(true);
        });

        it('должен отклонить имя 101 символ', () => {
            const tooLongName = 'А'.repeat(101);
            expect(validator.validate(tooLongName)).toBe(false);
        });
    });

    describe('Сообщение об ошибке', () => {
        it('должен вернуть корректное сообщение по умолчанию', () => {
            expect(validator.defaultMessage()).toBe(
                'Имя должно содержать от 2 до 100 символов, только буквы, пробелы, дефисы и апострофы',
            );
        });
    });
});
