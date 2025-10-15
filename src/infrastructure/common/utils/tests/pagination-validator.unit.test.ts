import { PaginationValidator } from '../pagination-validator';

describe('PaginationValidator', () => {
    describe('validateSort', () => {
        it('должен вернуть ASC для валидного значения "ASC"', () => {
            expect(PaginationValidator.validateSort('ASC')).toBe('ASC');
        });

        it('должен вернуть ASC для валидного значения "asc" (регистронезависимо)', () => {
            expect(PaginationValidator.validateSort('asc')).toBe('ASC');
        });

        it('должен вернуть DESC для валидного значения "DESC"', () => {
            expect(PaginationValidator.validateSort('DESC')).toBe('DESC');
        });

        it('должен вернуть DESC для валидного значения "desc" (регистронезависимо)', () => {
            expect(PaginationValidator.validateSort('desc')).toBe('DESC');
        });

        it('должен вернуть DESC по умолчанию для невалидного значения', () => {
            expect(PaginationValidator.validateSort('INVALID')).toBe('DESC');
        });

        it('должен вернуть DESC по умолчанию для null', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(PaginationValidator.validateSort(null as any)).toBe('DESC');
        });

        it('должен вернуть DESC по умолчанию для undefined', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(PaginationValidator.validateSort(undefined as any)).toBe(
                'DESC',
            );
        });

        it('должен вернуть кастомное значение по умолчанию (ASC)', () => {
            expect(PaginationValidator.validateSort('INVALID', 'ASC')).toBe(
                'ASC',
            );
        });
    });

    describe('validateLimit', () => {
        it('должен вернуть валидное значение в пределах диапазона', () => {
            expect(PaginationValidator.validateLimit(10)).toBe(10);
            expect(PaginationValidator.validateLimit(50)).toBe(50);
        });

        it('должен ограничить до максимального значения 100', () => {
            expect(PaginationValidator.validateLimit(999)).toBe(100);
            expect(PaginationValidator.validateLimit(150)).toBe(100);
        });

        it('должен установить минимум 1 для отрицательных значений', () => {
            expect(PaginationValidator.validateLimit(-10)).toBe(1);
            expect(PaginationValidator.validateLimit(-1)).toBe(1);
        });

        it('должен установить минимум 1 для нуля', () => {
            expect(PaginationValidator.validateLimit(0)).toBe(1);
        });

        it('должен вернуть 5 по умолчанию для null', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(PaginationValidator.validateLimit(null as any)).toBe(5);
        });

        it('должен вернуть 5 по умолчанию для undefined', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(PaginationValidator.validateLimit(undefined as any)).toBe(5);
        });

        it('должен использовать кастомные параметры (defaultLimit = 10, maxLimit = 50)', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(PaginationValidator.validateLimit(null as any, 10, 50)).toBe(
                10,
            );
            expect(PaginationValidator.validateLimit(100, 10, 50)).toBe(50);
        });
    });

    describe('validateOffset', () => {
        it('должен вернуть валидное положительное значение', () => {
            expect(PaginationValidator.validateOffset(0)).toBe(0);
            expect(PaginationValidator.validateOffset(10)).toBe(10);
            expect(PaginationValidator.validateOffset(100)).toBe(100);
        });

        it('должен установить минимум 0 для отрицательных значений', () => {
            expect(PaginationValidator.validateOffset(-1)).toBe(0);
            expect(PaginationValidator.validateOffset(-100)).toBe(0);
        });

        it('должен вернуть 0 по умолчанию для null', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(PaginationValidator.validateOffset(null as any)).toBe(0);
        });

        it('должен вернуть 0 по умолчанию для undefined', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(PaginationValidator.validateOffset(undefined as any)).toBe(
                0,
            );
        });
    });

    describe('Edge cases (SQL Injection protection)', () => {
        it('validateSort должен защищать от SQL injection попыток', () => {
            expect(
                PaginationValidator.validateSort("'; DROP TABLE users; --"),
            ).toBe('DESC');
            expect(PaginationValidator.validateSort('1=1')).toBe('DESC');
            expect(PaginationValidator.validateSort('OR 1=1')).toBe('DESC');
        });

        it('validateLimit должен защищать от DoS атак (огромные значения)', () => {
            expect(
                PaginationValidator.validateLimit(Number.MAX_SAFE_INTEGER),
            ).toBe(100);
            expect(PaginationValidator.validateLimit(999999999)).toBe(100);
        });

        it('validateOffset должен защищать от переполнения', () => {
            expect(
                PaginationValidator.validateOffset(Number.MAX_SAFE_INTEGER),
            ).toBe(Number.MAX_SAFE_INTEGER);
            expect(
                PaginationValidator.validateOffset(Number.MIN_SAFE_INTEGER),
            ).toBe(0);
        });
    });
});
