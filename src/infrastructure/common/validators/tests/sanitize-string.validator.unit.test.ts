import { IsSanitizedStringConstraint } from '@app/infrastructure/common/validators/sanitize-string.validator';

describe('IsSanitizedStringConstraint (unit)', () => {
    // Оптимизация: создаём validator один раз для всех тестов
    const validator = new IsSanitizedStringConstraint();

    // Оптимизация: тестовые данные вынесены в константы
    const validStrings = [
        'Обычный текст', // чистая строка
        'Текст 123', // с цифрами
        'test@mail.com', // email
        'Товар-новинка', // с дефисом
        'Цена: 1000 руб.', // с двоеточием и точкой
        '  текст  ', // с пробелами по краям
        'Тестовый текст на русском', // кириллица
    ];

    const xssAttacks = [
        '<script>alert("xss")</script>',
        'Текст <script>alert(1)</script>',
        'javascript:alert(1)',
        '<a href="javascript:alert(1)">click</a>',
        '<img onerror="alert(1)">',
        '<div onclick="alert(1)">',
        'onload=alert(1)',
        'data:text/html,<script>alert(1)',
        'vbscript:msgbox(1)',
        '<div>content</div>',
        '<p>text</p>',
        'Text <b>bold</b>',
    ];

    describe('Валидные строки', () => {
        it('должен принять все валидные строки', () => {
            // Оптимизация: один тест вместо пяти
            validStrings.forEach((str) => {
                expect(validator.validate(str)).toBe(true);
            });
        });
    });

    describe('XSS-атаки (должны быть заблокированы)', () => {
        it('должен отклонить все XSS-атаки', () => {
            // Оптимизация: один тест для всех XSS-паттернов
            xssAttacks.forEach((attack) => {
                expect(validator.validate(attack)).toBe(false);
            });
        });
    });

    describe('Граничные случаи', () => {
        it('должен отклонить невалидные входные данные', () => {
            // Оптимизация: объединяем все граничные случаи
            expect(validator.validate('')).toBe(false);
            expect(validator.validate('   ')).toBe(false);
            expect(validator.validate(123 as unknown as string)).toBe(false);
            expect(validator.validate({} as unknown as string)).toBe(false);
            expect(validator.validate(null as unknown as string)).toBe(false);
            expect(validator.validate(undefined as unknown as string)).toBe(
                false,
            );
        });
    });

    describe('Сообщение об ошибке', () => {
        it('должен вернуть корректное сообщение по умолчанию', () => {
            expect(validator.defaultMessage()).toBe(
                'Строка содержит недопустимые символы или HTML теги.',
            );
        });
    });
});
