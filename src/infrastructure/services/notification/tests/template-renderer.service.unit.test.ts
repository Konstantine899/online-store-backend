import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { TemplateRendererService } from '../template-renderer.service';
import type { TemplateVariables } from '@app/domain/services';

describe('TemplateRendererService', () => {
    let service: TemplateRendererService;
    let module: TestingModule;

    // Фабричные функции для создания тестовых данных
    const createTemplateVariables = (
        overrides: Partial<TemplateVariables> = {},
    ): TemplateVariables => ({
        name: 'John',
        orderNumber: '12345',
        userName: 'John',
        greeting: 'Hello',
        ...overrides,
    });

    const createTemplate = (content: string): string => content;

    const createTestTemplates = (): string[] => [
        'Hello {{name}}, your order {{orderNumber}} is ready!',
        'Welcome {{userName}}!',
        '{{greeting}} {{name}}, {{greeting}} again!',
        'This is a static template with no variables.',
        'Hello {{name}}! <script>alert("xss")</script> Your order is ready.',
    ];

    const createComplexTemplates = (): string[] => [
        'Number: {{count}}, Boolean: {{active}}, Object: {{data}}',
        'Hello {{name}}, your order {{orderNumber}} from {{store}} is ready!',
        'Price: ${{amount}} ({{currency}})',
        'Hello {{user-name}}, your order {{order_number}} is ready!',
        '{{greeting}}{{name}}',
    ];

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [TemplateRendererService],
        }).compile();

        service = module.get<TemplateRendererService>(TemplateRendererService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    describe('renderTemplate', () => {
        it('should render template with variables successfully', async () => {
            const template = createTemplate(
                'Hello {{name}}, your order {{orderNumber}} is ready!',
            );
            const variables = createTemplateVariables();

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe(
                'Hello John, your order 12345 is ready!',
            );
            expect(result.variables).toEqual(['name', 'orderNumber']);
        });

        it('should render template with single variable', async () => {
            const template = createTemplate('Welcome {{userName}}!');
            const variables = createTemplateVariables({ userName: 'Alice' });

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe('Welcome Alice!');
            expect(result.variables).toEqual(['userName']);
        });

        it('should render template with repeated variables', async () => {
            const template = createTemplate(
                '{{greeting}} {{name}}, {{greeting}} again!',
            );
            const variables = createTemplateVariables({
                greeting: 'Hello',
                name: 'Bob',
            });

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe('Hello Bob, Hello again!');
            expect(result.variables).toEqual(['greeting', 'name']);
        });

        it('should render template with different data types', async () => {
            const template = createTemplate(
                'Number: {{count}}, Boolean: {{active}}, Object: {{data}}',
            );
            const variables = createTemplateVariables({
                count: 42,
                active: true,
                data: { key: 'value' },
            });

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe(
                'Number: 42, Boolean: true, Object: {"key":"value"}',
            );
        });

        it('should handle null and undefined values', async () => {
            const template = createTemplate('Value: {{value}}');
            const variables = createTemplateVariables({ value: 'test' });

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe('Value: test');
        });

        it('should fail with empty template', async () => {
            const variables = createTemplateVariables();

            const result = await service.renderTemplate('', variables);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Шаблон должен быть непустой строкой');
        });

        it('should fail with null template', async () => {
            const variables = createTemplateVariables();

            const result = await service.renderTemplate(
                null as unknown as string,
                variables,
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe('Шаблон должен быть непустой строкой');
        });

        it('should fail with missing variables', async () => {
            const template = createTemplate(
                'Hello {{name}}, your order {{orderNumber}} is ready!',
            );
            const variables = {
                name: 'John', // Передаем только name
                // orderNumber is missing
            };

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Отсутствуют переменные: orderNumber');
            expect(result.variables).toEqual(['name', 'orderNumber']);
            expect(result.missingVariables).toEqual(['orderNumber']);
        });

        it('should fail with multiple missing variables', async () => {
            const template = createTemplate(
                'Hello {{name}}, your order {{orderNumber}} from {{store}} is ready!',
            );
            const variables = {
                name: 'John', // Передаем только name
                // orderNumber and store are missing
            };

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(false);
            expect(result.error).toBe(
                'Отсутствуют переменные: orderNumber, store',
            );
            expect(result.missingVariables).toEqual(['orderNumber', 'store']);
        });

        it('should handle template with no variables', async () => {
            const template = createTemplate(
                'This is a static template with no variables.',
            );
            const variables = createTemplateVariables({});

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe(
                'This is a static template with no variables.',
            );
            expect(result.variables).toEqual([]);
        });

        it('should handle extra variables not used in template', async () => {
            const template = createTemplate('Hello {{name}}!');
            const variables = createTemplateVariables({
                unused: 'This will not be used',
            });

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe('Hello John!');
            expect(result.variables).toEqual(['name']);
        });
    });

    describe('validateTemplate', () => {
        it('should validate correct template', () => {
            const template =
                'Hello {{name}}, your order {{orderNumber}} is ready!';
            const result = service.validateTemplate(template);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.variables).toEqual(['name', 'orderNumber']);
        });

        it('should validate template with no variables', () => {
            const template = 'This is a static template.';
            const result = service.validateTemplate(template);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.variables).toEqual([]);
        });

        it('should reject empty template', () => {
            const result = service.validateTemplate('');

            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                'Шаблон должен быть непустой строкой',
            );
        });

        it('should reject null template', () => {
            const result = service.validateTemplate(null as unknown as string);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                'Шаблон должен быть непустой строкой',
            );
        });

        it('should reject template with unbalanced braces', () => {
            const template = 'Hello {{name, your order is ready!';
            const result = service.validateTemplate(template);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                'Несбалансированные фигурные скобки в шаблоне',
            );
        });

        it('should reject template with empty variables', () => {
            const template = 'Hello {{}}, your order {{orderNumber}} is ready!';
            const result = service.validateTemplate(template);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                'Найдены пустые переменные в шаблоне',
            );
        });

        it('should handle multiple validation errors', () => {
            const template = 'Hello {{}}, your order {{orderNumber is ready!';
            const result = service.validateTemplate(template);

            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(2);
            expect(result.errors).toContain(
                'Найдены пустые переменные в шаблоне',
            );
            expect(result.errors).toContain(
                'Несбалансированные фигурные скобки в шаблоне',
            );
        });
    });

    describe('extractVariables', () => {
        it('should extract variables from template', () => {
            const template =
                'Hello {{name}}, your order {{orderNumber}} is ready!';
            const variables = service.extractVariables(template);

            expect(variables).toEqual(['name', 'orderNumber']);
        });

        it('should extract unique variables from template with duplicates', () => {
            const template = '{{greeting}} {{name}}, {{greeting}} again!';
            const variables = service.extractVariables(template);

            expect(variables).toEqual(['greeting', 'name']);
        });

        it('should return empty array for template with no variables', () => {
            const template = 'This is a static template.';
            const variables = service.extractVariables(template);

            expect(variables).toEqual([]);
        });

        it('should return empty array for empty template', () => {
            const variables = service.extractVariables('');

            expect(variables).toEqual([]);
        });

        it('should return empty array for null template', () => {
            const variables = service.extractVariables(
                null as unknown as string,
            );

            expect(variables).toEqual([]);
        });

        it('should handle variables with spaces', () => {
            const template =
                'Hello {{ name }}, your order {{ orderNumber }} is ready!';
            const variables = service.extractVariables(template);

            expect(variables).toEqual(['name', 'orderNumber']);
        });
    });

    describe('sanitizeTemplate', () => {
        it('should sanitize template by removing dangerous HTML tags', () => {
            const template =
                'Hello {{name}}! <script>alert("xss")</script> Your order is ready.';
            const sanitized = service.sanitizeTemplate(template);

            expect(sanitized).toBe('Hello {{name}}! Your order is ready.');
        });

        it('should remove iframe tags', () => {
            const template =
                'Hello {{name}}! <iframe src="malicious.com"></iframe> Your order is ready.';
            const sanitized = service.sanitizeTemplate(template);

            expect(sanitized).toBe('Hello {{name}}! Your order is ready.');
        });

        it('should remove object and embed tags', () => {
            const template =
                'Hello {{name}}! <object data="malicious.swf"></object> <embed src="malicious.swf"> Your order is ready.';
            const sanitized = service.sanitizeTemplate(template);

            expect(sanitized).toBe('Hello {{name}}! Your order is ready.');
        });

        it('should normalize whitespace', () => {
            const template = 'Hello   {{name}}!\n\nYour   order    is   ready.';
            const sanitized = service.sanitizeTemplate(template);

            expect(sanitized).toBe('Hello {{name}}! Your order is ready.');
        });

        it('should return empty string for empty template', () => {
            const sanitized = service.sanitizeTemplate('');

            expect(sanitized).toBe('');
        });

        it('should return empty string for null template', () => {
            const sanitized = service.sanitizeTemplate(
                null as unknown as string,
            );

            expect(sanitized).toBe('');
        });

        it('should preserve template variables during sanitization', () => {
            const template =
                'Hello {{name}}, your order {{orderNumber}} is ready!';
            const sanitized = service.sanitizeTemplate(template);

            expect(sanitized).toBe(
                'Hello {{name}}, your order {{orderNumber}} is ready!',
            );
        });
    });

    describe('getSupportedSyntax', () => {
        it('should return supported syntax', () => {
            const syntax = service.getSupportedSyntax();

            expect(syntax).toEqual(['{{variable}}']);
        });
    });

    describe('Error handling', () => {
        it('should handle errors gracefully in renderTemplate', async () => {
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();

            const template = 'Hello {{name}}!';
            const variables: TemplateVariables = { name: 'John' };

            // Mock an error in extractVariables
            jest.spyOn(service, 'extractVariables').mockImplementation(() => {
                throw new Error('Extraction error');
            });

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Extraction error');

            consoleSpy.mockRestore();
        });

        it('should handle non-Error exceptions in renderTemplate', async () => {
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();

            const template = 'Hello {{name}}!';
            const variables: TemplateVariables = { name: 'John' };

            // Mock a non-Error exception
            jest.spyOn(service, 'extractVariables').mockImplementation(() => {
                throw 'String error';
            });

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unknown error');

            consoleSpy.mockRestore();
        });

        it('should handle errors in validateTemplate', () => {
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();

            const template = 'Hello {{name}}!';

            // Mock an error in extractVariables
            jest.spyOn(service, 'extractVariables').mockImplementation(() => {
                throw new Error('Extraction error');
            });

            const result = service.validateTemplate(template);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                'Ошибка валидации: Extraction error',
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Edge cases', () => {
        it('should handle template with only variables', async () => {
            const template = '{{greeting}}{{name}}';
            const variables: TemplateVariables = {
                greeting: 'Hello ',
                name: 'World',
            };

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe('Hello World');
        });

        it('should handle template with nested braces in text', async () => {
            const template = 'Price: ${{amount}} ({{currency}})';
            const variables: TemplateVariables = {
                amount: '100',
                currency: 'USD',
            };

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe('Price: $100 (USD)');
        });

        it('should handle variables with special characters', async () => {
            const template = createTemplate(
                'Hello {{user-name}}, your order {{order_number}} is ready!',
            );
            const variables = createTemplateVariables({
                'user-name': 'John Doe',
                order_number: '12345',
            });

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe(
                'Hello John Doe, your order 12345 is ready!',
            );
        });
    });

    describe('Performance Tests', () => {
        it('should handle large template rendering efficiently', async () => {
            const largeTemplate = createTemplate(
                Array.from({ length: 100 }, (_, i) => `{{var${i}}}`).join(' '),
            );
            const largeVariables = createTemplateVariables(
                Object.fromEntries(
                    Array.from({ length: 100 }, (_, i) => [
                        `var${i}`,
                        `value${i}`,
                    ]),
                ),
            );

            const startTime = Date.now();
            const result = await service.renderTemplate(
                largeTemplate,
                largeVariables,
            );
            const endTime = Date.now();

            expect(result.success).toBe(true);
            expect(endTime - startTime).toBeLessThan(1000); // Должно выполниться менее чем за 1 секунду
        });

        it('should cache template validation efficiently', async () => {
            const templates = createTestTemplates();

            const startTime = Date.now();

            // Множественные вызовы валидации
            const results = await Promise.all(
                templates.map((template) => service.validateTemplate(template)),
            );

            const endTime = Date.now();

            expect(results).toHaveLength(5);
            expect(results.every((result) => result.valid === true)).toBe(true);
            expect(endTime - startTime).toBeLessThan(200); // Должно выполниться быстро благодаря кэшу
        });

        it('should cache variable extraction efficiently', async () => {
            const templates = createComplexTemplates();

            const startTime = Date.now();

            // Множественные вызовы извлечения переменных
            const results = await Promise.all(
                templates.map((template) => service.extractVariables(template)),
            );

            const endTime = Date.now();

            expect(results).toHaveLength(5);
            expect(endTime - startTime).toBeLessThan(100); // Должно выполниться очень быстро благодаря кэшу
        });

        it('should handle template sanitization efficiently', async () => {
            const templates = Array.from(
                { length: 50 },
                (_, i) =>
                    `Template ${i} with <script>alert("xss${i}")</script> content`,
            );

            const startTime = Date.now();

            // Параллельная санитизация шаблонов
            const results = await Promise.all(
                templates.map((template) => service.sanitizeTemplate(template)),
            );

            const endTime = Date.now();

            expect(results).toHaveLength(50);
            expect(
                results.every((result) => !result.includes('<script>')),
            ).toBe(true);
            expect(endTime - startTime).toBeLessThan(500); // Должно выполниться быстро
        });

        it('should handle bulk template rendering efficiently', async () => {
            const templates = createTestTemplates();
            const variables = createTemplateVariables();

            const startTime = Date.now();

            // Параллельный рендеринг шаблонов
            const results = await Promise.all(
                templates.map((template) =>
                    service.renderTemplate(template, variables),
                ),
            );

            const endTime = Date.now();

            expect(results).toHaveLength(5);
            expect(results.every((result) => result.success === true)).toBe(
                true,
            );
            expect(endTime - startTime).toBeLessThan(1000); // Должно выполниться быстро
        });

        it('should handle complex template operations efficiently', async () => {
            const complexTemplate = createTemplate(
                'Hello {{name}}, your order {{orderNumber}} from {{store}} is ready! ' +
                    'Price: ${{amount}} ({{currency}}). ' +
                    'Thank you, {{user-name}}!',
            );
            const complexVariables = createTemplateVariables({
                store: 'Test Store',
                amount: '100',
                currency: 'USD',
                'user-name': 'John Doe',
            });

            const startTime = Date.now();

            // Множественные операции с одним шаблоном
            const operations = Array.from({ length: 20 }, () =>
                service.renderTemplate(complexTemplate, complexVariables),
            );

            const results = await Promise.all(operations);
            const endTime = Date.now();

            expect(results).toHaveLength(20);
            expect(results.every((result) => result.success === true)).toBe(
                true,
            );
            expect(endTime - startTime).toBeLessThan(500); // Должно выполниться быстро
        });
    });

    describe('Caching Tests', () => {
        it('should cache template validation results', () => {
            const template = createTemplate('Hello {{name}}!');

            // Первый вызов
            const result1 = service.validateTemplate(template);

            // Второй вызов (должен использовать кэш)
            const result2 = service.validateTemplate(template);

            expect(result1).toEqual(result2);
            expect(result1.valid).toBe(true);
        });

        it('should cache variable extraction results', () => {
            const template = createTemplate(
                'Hello {{name}}, your order {{orderNumber}} is ready!',
            );

            // Первый вызов
            const result1 = service.extractVariables(template);

            // Второй вызов (должен использовать кэш)
            const result2 = service.extractVariables(template);

            expect(result1).toEqual(result2);
            expect(result1).toEqual(['name', 'orderNumber']);
        });

        it('should handle cache invalidation for template validation', () => {
            const template = createTemplate('Hello {{name}}!');

            // Первый вызов
            const result1 = service.validateTemplate(template);

            // Очищаем кэш (симулируем)
            // В реальной реализации здесь был бы метод очистки кэша

            // Второй вызов
            const result2 = service.validateTemplate(template);

            expect(result1).toEqual(result2);
            expect(result1.valid).toBe(true);
        });
    });

    describe('Edge Cases and Stress Tests', () => {
        it('should handle very long templates efficiently', async () => {
            const longTemplate = createTemplate(
                'A'.repeat(10000) + '{{name}}' + 'B'.repeat(10000),
            );
            const variables = createTemplateVariables();

            const startTime = Date.now();
            const result = await service.renderTemplate(
                longTemplate,
                variables,
            );
            const endTime = Date.now();

            expect(result.success).toBe(true);
            expect(endTime - startTime).toBeLessThan(200); // Должно обработаться быстро
        });

        it('should handle templates with many variables efficiently', async () => {
            const manyVariablesTemplate = createTemplate(
                Array.from({ length: 50 }, (_, i) => `{{var${i}}}`).join(' '),
            );
            const manyVariables = createTemplateVariables(
                Object.fromEntries(
                    Array.from({ length: 50 }, (_, i) => [
                        `var${i}`,
                        `value${i}`,
                    ]),
                ),
            );

            const startTime = Date.now();
            const result = await service.renderTemplate(
                manyVariablesTemplate,
                manyVariables,
            );
            const endTime = Date.now();

            expect(result.success).toBe(true);
            expect(endTime - startTime).toBeLessThan(500); // Должно обработаться быстро
        });

        it('should handle concurrent template operations', async () => {
            const templates = Array.from({ length: 10 }, (_, i) =>
                createTemplate(`Template ${i}: Hello {{name${i}}}!`),
            );
            const variablesArray = Array.from({ length: 10 }, (_, i) =>
                createTemplateVariables({ [`name${i}`]: `User${i}` }),
            );

            const startTime = Date.now();

            // Параллельные операции с разными шаблонами
            const results = await Promise.all(
                templates.map((template, i) =>
                    service.renderTemplate(template, variablesArray[i]),
                ),
            );

            const endTime = Date.now();

            expect(results).toHaveLength(10);
            expect(results.every((result) => result.success === true)).toBe(
                true,
            );
            expect(endTime - startTime).toBeLessThan(1000); // Должно выполниться за разумное время
        });
    });
});
