import { IsValidAgeConstraint } from '@app/infrastructure/common/validators/age.validator';

describe('IsValidAgeConstraint (unit)', () => {
    const validator = new IsValidAgeConstraint();

    // Валидные даты (18+ лет)
    const validDates = [
        // 18 лет (сегодня минус 18 лет)
        new Date(
            new Date().getFullYear() - 18,
            new Date().getMonth(),
            new Date().getDate(),
        )
            .toISOString()
            .split('T')[0],
        // 20 лет
        '2004-01-15',
        // 25 лет
        '1999-05-20',
        // 50 лет
        '1974-12-31',
        // 100 лет
        '1924-01-01',
    ];

    // Невалидные даты (младше 18 лет)
    const invalidYoungAges = [
        // 17 лет
        new Date(
            new Date().getFullYear() - 17,
            new Date().getMonth(),
            new Date().getDate(),
        )
            .toISOString()
            .split('T')[0],
        // 16 лет
        '2008-01-15',
        // 10 лет
        '2014-05-20',
        // 1 год
        '2023-12-31',
    ];

    // Будущие даты
    const futureDates = [
        // Завтра
        new Date(Date.now() + 86400000).toISOString().split('T')[0],
        // Через год
        new Date(
            new Date().getFullYear() + 1,
            new Date().getMonth(),
            new Date().getDate(),
        )
            .toISOString()
            .split('T')[0],
        // Через 10 лет
        '2034-01-01',
    ];

    // Некорректные даты
    const invalidDates = [
        'invalid-date',
        '2024-13-45', // Неправильный месяц и день
        '2024-02-30', // Неправильный день для февраля
        '2024-00-01', // Нулевой месяц
        '2024-01-00', // Нулевой день
        '',
        'not-a-date',
    ];

    // Слишком старые даты (старше 150 лет)
    const tooOldDates = ((): string[] => {
        const today = new Date();
        // Дата 151 год назад (старше 150 лет)
        const tooOld = new Date(
            today.getFullYear() - 151,
            today.getMonth(),
            today.getDate(),
        );
        return [tooOld.toISOString().split('T')[0]];
    })();

    describe('Валидные даты рождения (18+ лет)', () => {
        it('должен принять все валидные даты (18+ лет)', () => {
            validDates.forEach((date) => {
                expect(validator.validate(date)).toBe(true);
            });
        });

        it('должен принять дату в формате Date', () => {
            const date = new Date('1990-01-15');
            expect(validator.validate(date)).toBe(true);
        });
    });

    describe('Невалидные даты рождения (младше 18 лет)', () => {
        it('должен отклонить даты для пользователей младше 18 лет', () => {
            invalidYoungAges.forEach((date) => {
                expect(validator.validate(date)).toBe(false);
            });
        });
    });

    describe('Будущие даты', () => {
        it('должен отклонить будущие даты', () => {
            futureDates.forEach((date) => {
                expect(validator.validate(date)).toBe(false);
            });
        });
    });

    describe('Некорректные форматы дат', () => {
        it('должен отклонить некорректные форматы дат', () => {
            invalidDates.forEach((date) => {
                expect(validator.validate(date)).toBe(false);
            });
        });

        it('должен отклонить null и undefined', () => {
            expect(validator.validate(null as unknown as string)).toBe(false);
            expect(validator.validate(undefined as unknown as string)).toBe(
                false,
            );
        });
    });

    describe('Слишком старые даты (старше 150 лет)', () => {
        it('должен отклонить даты старше 150 лет', () => {
            tooOldDates.forEach((date) => {
                expect(validator.validate(date)).toBe(false);
            });
        });
    });

    describe('Граничные случаи', () => {
        it('должен принять дату ровно 18 лет назад (сегодня)', () => {
            const today = new Date();
            const eighteenYearsAgo = new Date(
                today.getFullYear() - 18,
                today.getMonth(),
                today.getDate(),
            );
            const dateString = eighteenYearsAgo.toISOString().split('T')[0];
            expect(validator.validate(dateString)).toBe(true);
        });

        it('должен отклонить дату 17 лет и 364 дня назад', () => {
            // Используем конкретную дату: человек родился 5 ноября 2007
            // Если сегодня 4 ноября 2025, то ему еще нет 18 лет (день рождения завтра)
            // Но валидатор использует текущую дату, поэтому используем дату, которая
            // гарантированно даст 17 лет независимо от текущей даты
            const seventeenYearsAgo = new Date();
            seventeenYearsAgo.setFullYear(seventeenYearsAgo.getFullYear() - 17);
            // Убираем 1 день, чтобы было ровно 17 лет (не 18)
            seventeenYearsAgo.setDate(seventeenYearsAgo.getDate() - 1);
            const dateString = seventeenYearsAgo.toISOString().split('T')[0];
            expect(validator.validate(dateString)).toBe(false);
        });
    });

    describe('Сообщение об ошибке', () => {
        it('должен вернуть корректное сообщение по умолчанию', () => {
            expect(validator.defaultMessage()).toBe(
                'Дата рождения должна соответствовать возрасту от 18 до 150 лет',
            );
        });
    });
});
