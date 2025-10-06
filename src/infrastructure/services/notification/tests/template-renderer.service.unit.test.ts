import { Test, TestingModule } from '@nestjs/testing';
import { TemplateRendererService } from '../template-renderer.service';
import { TemplateVariables } from '@app/domain/services';

describe('TemplateRendererService', () => {
    let service: TemplateRendererService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TemplateRendererService],
        }).compile();

        service = module.get<TemplateRendererService>(TemplateRendererService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('renderTemplate', () => {
        it('should render template with variables successfully', async () => {
            const template =
                'Hello {{name}}, your order {{orderNumber}} is ready!';
            const variables: TemplateVariables = {
                name: 'John',
                orderNumber: '12345',
            };

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe(
                'Hello John, your order 12345 is ready!',
            );
            expect(result.variables).toEqual(['name', 'orderNumber']);
        });

        it('should render template with single variable', async () => {
            const template = 'Welcome {{userName}}!';
            const variables: TemplateVariables = {
                userName: 'Alice',
            };

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe('Welcome Alice!');
            expect(result.variables).toEqual(['userName']);
        });

        it('should render template with repeated variables', async () => {
            const template = '{{greeting}} {{name}}, {{greeting}} again!';
            const variables: TemplateVariables = {
                greeting: 'Hello',
                name: 'Bob',
            };

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe('Hello Bob, Hello again!');
            expect(result.variables).toEqual(['greeting', 'name']);
        });

        it('should render template with different data types', async () => {
            const template =
                'Number: {{count}}, Boolean: {{active}}, Object: {{data}}';
            const variables: TemplateVariables = {
                count: 42,
                active: true,
                data: { key: 'value' },
            };

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe(
                'Number: 42, Boolean: true, Object: {"key":"value"}',
            );
        });

        it('should handle null and undefined values', async () => {
            const template = 'Value: {{value}}';
            const variables: TemplateVariables = {
                value: 'test',
            };

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe('Value: test');
        });

        it('should fail with empty template', async () => {
            const variables: TemplateVariables = { name: 'John' };

            const result = await service.renderTemplate('', variables);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Шаблон должен быть непустой строкой');
        });

        it('should fail with null template', async () => {
            const variables: TemplateVariables = { name: 'John' };

            const result = await service.renderTemplate(
                null as unknown as string,
                variables,
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe('Шаблон должен быть непустой строкой');
        });

        it('should fail with missing variables', async () => {
            const template =
                'Hello {{name}}, your order {{orderNumber}} is ready!';
            const variables: TemplateVariables = {
                name: 'John',
                // orderNumber is missing
            };

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Отсутствуют переменные: orderNumber');
            expect(result.variables).toEqual(['name', 'orderNumber']);
            expect(result.missingVariables).toEqual(['orderNumber']);
        });

        it('should fail with multiple missing variables', async () => {
            const template =
                'Hello {{name}}, your order {{orderNumber}} from {{store}} is ready!';
            const variables: TemplateVariables = {
                // All variables are missing
            };

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(false);
            expect(result.error).toBe(
                'Отсутствуют переменные: name, orderNumber, store',
            );
            expect(result.missingVariables).toEqual([
                'name',
                'orderNumber',
                'store',
            ]);
        });

        it('should handle template with no variables', async () => {
            const template = 'This is a static template with no variables.';
            const variables: TemplateVariables = {};

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe(
                'This is a static template with no variables.',
            );
            expect(result.variables).toEqual([]);
        });

        it('should handle extra variables not used in template', async () => {
            const template = 'Hello {{name}}!';
            const variables: TemplateVariables = {
                name: 'John',
                unused: 'This will not be used',
            };

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
            const template =
                'Hello {{user-name}}, your order {{order_number}} is ready!';
            const variables: TemplateVariables = {
                'user-name': 'John Doe',
                order_number: '12345',
            };

            const result = await service.renderTemplate(template, variables);

            expect(result.success).toBe(true);
            expect(result.content).toBe(
                'Hello John Doe, your order 12345 is ready!',
            );
        });
    });
});
