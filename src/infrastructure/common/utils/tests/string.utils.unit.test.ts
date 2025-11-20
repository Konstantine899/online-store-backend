import { escapeLikeWildcards } from '../string.utils';

describe('String Utils (unit)', () => {
    describe('escapeLikeWildcards', () => {
        describe('Экранирование percent (%)', () => {
            it('должен экранировать одиночный символ %', () => {
                expect(escapeLikeWildcards('test%')).toBe('test\\%');
            });

            it('должен экранировать множественные символы %', () => {
                expect(escapeLikeWildcards('%%test%%')).toBe('\\%\\%test\\%\\%');
            });

            it('должен экранировать % в середине строки', () => {
                expect(escapeLikeWildcards('test%value')).toBe('test\\%value');
            });

            it('должен обработать строку только из %', () => {
                expect(escapeLikeWildcards('%%%')).toBe('\\%\\%\\%');
            });

            it('должен обработать реальный кейс: "100%"', () => {
                expect(escapeLikeWildcards('100%')).toBe('100\\%');
            });
        });

        describe('Экранирование underscore (_)', () => {
            it('должен экранировать одиночный символ _', () => {
                expect(escapeLikeWildcards('test_')).toBe('test\\_');
            });

            it('должен экранировать множественные символы _', () => {
                expect(escapeLikeWildcards('__test__')).toBe('\\_\\_test\\_\\_');
            });

            it('должен экранировать _ в середине строки', () => {
                expect(escapeLikeWildcards('test_value')).toBe('test\\_value');
            });

            it('должен обработать строку только из _', () => {
                expect(escapeLikeWildcards('___')).toBe('\\_\\_\\_');
            });

            it('должен обработать реальный кейс: "user_name"', () => {
                expect(escapeLikeWildcards('user_name')).toBe('user\\_name');
            });
        });

        describe('Экранирование backslash (\\)', () => {
            it('должен экранировать одиночный символ \\', () => {
                expect(escapeLikeWildcards('test\\')).toBe('test\\\\');
            });

            it('должен экранировать множественные символы \\', () => {
                expect(escapeLikeWildcards('\\\\test\\\\')).toBe('\\\\\\\\test\\\\\\\\');
            });

            it('должен экранировать \\ в середине строки', () => {
                expect(escapeLikeWildcards('test\\value')).toBe('test\\\\value');
            });

            it('должен обработать строку только из \\', () => {
                expect(escapeLikeWildcards('\\\\\\')).toBe('\\\\\\\\\\\\');
            });

            it('должен обработать реальный кейс: "C:\\Users"', () => {
                expect(escapeLikeWildcards('C:\\Users')).toBe('C:\\\\Users');
            });
        });

        describe('Комбинированные кейсы', () => {
            it('должен экранировать все три символа вместе', () => {
                expect(escapeLikeWildcards('test%value_name\\path')).toBe(
                    'test\\%value\\_name\\\\path',
                );
            });

            it('должен экранировать повторяющиеся комбинации', () => {
                expect(escapeLikeWildcards('%%__\\\\')).toBe(
                    '\\%\\%\\_\\_\\\\\\\\',
                );
            });

            it('должен обработать реальный кейс: SQL LIKE паттерн', () => {
                expect(escapeLikeWildcards('50% OFF_SALE\\')).toBe(
                    '50\\% OFF\\_SALE\\\\',
                );
            });

            it('должен корректно экранировать уже экранированные символы', () => {
                // Пользователь вводит "test\\%", что означает буквально "test\%"
                // После экранирования: "test\\\\\\%"
                expect(escapeLikeWildcards('test\\%')).toBe('test\\\\\\%');
            });

            it('должен обработать сложный реальный кейс: путь Windows с wildcard', () => {
                expect(escapeLikeWildcards('C:\\Users\\test%\\data_')).toBe(
                    'C:\\\\Users\\\\test\\%\\\\data\\_',
                );
            });
        });

        describe('Граничные кейсы', () => {
            it('должен обработать пустую строку', () => {
                expect(escapeLikeWildcards('')).toBe('');
            });

            it('должен обработать строку без специальных символов', () => {
                expect(escapeLikeWildcards('simple text')).toBe('simple text');
            });

            it('должен обработать строку только с пробелами', () => {
                expect(escapeLikeWildcards('   ')).toBe('   ');
            });

            it('должен обработать строку с другими спецсимволами (не wildcard)', () => {
                expect(escapeLikeWildcards('test@example.com')).toBe(
                    'test@example.com',
                );
                expect(escapeLikeWildcards('price: $100')).toBe('price: $100');
            });

            it('должен обработать Unicode символы', () => {
                expect(escapeLikeWildcards('тест%значение_имя')).toBe(
                    'тест\\%значение\\_имя',
                );
            });

            it('должен обработать эмодзи и специальные Unicode', () => {
                expect(escapeLikeWildcards('test%🔥_value')).toBe(
                    'test\\%🔥\\_value',
                );
            });
        });

        describe('Безопасность: SQL Injection prevention', () => {
            it('должен предотвратить wildcard injection через %', () => {
                // Злоумышленник пытается получить все записи через "%"
                const malicious = '%';
                expect(escapeLikeWildcards(malicious)).toBe('\\%');
            });

            it('должен предотвратить wildcard injection через комбинацию', () => {
                // Злоумышленник пытается: "admin%' OR '1'='1"
                const malicious = "admin%' OR '1'='1";
                expect(escapeLikeWildcards(malicious)).toBe(
                    "admin\\%' OR '1'='1",
                );
            });

            it('должен предотвратить bypass через экранирование', () => {
                // Злоумышленник пытается обойти защиту: "test\\_"
                const malicious = 'test\\_';
                // После экранирования: "test\\\\\\_" - буквально "test\\_"
                expect(escapeLikeWildcards(malicious)).toBe('test\\\\\\_');
            });

            it('должен корректно обработать множественные попытки injection', () => {
                const malicious = '%%__\\\\%%__';
                expect(escapeLikeWildcards(malicious)).toBe(
                    '\\%\\%\\_\\_\\\\\\\\\\%\\%\\_\\_',
                );
            });
        });

        describe('Производительность и edge cases', () => {
            it('должен обработать длинную строку с множественными wildcard', () => {
                const longString = 'test%'.repeat(100);
                const expected = 'test\\%'.repeat(100);
                expect(escapeLikeWildcards(longString)).toBe(expected);
            });

            it('должен обработать строку с чередующимися wildcard', () => {
                const alternating = '%_\\'.repeat(50);
                const expected = '\\%\\_\\\\'.repeat(50);
                expect(escapeLikeWildcards(alternating)).toBe(expected);
            });

            it('должен сохранить порядок экранирования (backslash first)', () => {
                // Важно: сначала экранируем \, потом % и _
                // Иначе при экранировании "\" -> "\\" затем "%" -> "\%"
                // мы получим некорректное двойное экранирование
                const input = '\\%';
                const expected = '\\\\\\%'; // Буквально: "\\" + "\%"
                expect(escapeLikeWildcards(input)).toBe(expected);
            });
        });
    });
});

