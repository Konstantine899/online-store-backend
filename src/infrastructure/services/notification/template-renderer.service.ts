import { Injectable, Logger } from '@nestjs/common';
import {
    ITemplateRenderer,
    TemplateVariables,
    RenderResult,
} from '@app/domain/services';

@Injectable()
export class TemplateRendererService implements ITemplateRenderer {
    private readonly logger = new Logger(TemplateRendererService.name);
    private readonly supportedSyntax = ['{{variable}}'];

    async renderTemplate(
        template: string,
        variables: TemplateVariables,
    ): Promise<RenderResult> {
        try {
            if (!template || typeof template !== 'string') {
                return {
                    success: false,
                    error: 'Шаблон должен быть непустой строкой',
                };
            }

            // Извлекаем переменные из шаблона
            const templateVariables = this.extractVariables(template);
            const missingVariables: string[] = [];
            const usedVariables: string[] = [];

            // Проверяем наличие всех необходимых переменных
            for (const variable of templateVariables) {
                if (!(variable in variables)) {
                    missingVariables.push(variable);
                } else {
                    usedVariables.push(variable);
                }
            }

            if (missingVariables.length > 0) {
                return {
                    success: false,
                    error: `Отсутствуют переменные: ${missingVariables.join(', ')}`,
                    variables: templateVariables,
                    missingVariables,
                };
            }

            // Рендерим шаблон
            let renderedContent = template;

            for (const [variable, value] of Object.entries(variables)) {
                const placeholder = `{{${variable}}}`;
                const stringValue = this.convertToString(value);
                renderedContent = renderedContent.replace(
                    new RegExp(placeholder, 'g'),
                    stringValue,
                );
            }

            this.logger.debug(
                `Template rendered successfully with ${usedVariables.length} variables`,
            );

            return {
                success: true,
                content: renderedContent,
                variables: usedVariables,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(
                `Failed to render template: ${errorMessage}`,
                errorStack,
            );
            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    validateTemplate(template: string): {
        valid: boolean;
        errors: string[];
        variables: string[];
    } {
        const errors: string[] = [];
        const variables: string[] = [];

        try {
            if (!template || typeof template !== 'string') {
                errors.push('Шаблон должен быть непустой строкой');
                return { valid: false, errors, variables };
            }

            // Извлекаем переменные
            const extractedVariables = this.extractVariables(template);
            variables.push(...extractedVariables);

            // Проверяем синтаксис
            const syntaxErrors = this.validateSyntax(template);
            errors.push(...syntaxErrors);

            return {
                valid: errors.length === 0,
                errors,
                variables,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Ошибка валидации: ${errorMessage}`);
            return { valid: false, errors, variables };
        }
    }

    extractVariables(template: string): string[] {
        if (!template || typeof template !== 'string') {
            return [];
        }

        const variables: string[] = [];
        const variablePattern = /\{\{([^}]+)\}\}/g;
        let match;

        while ((match = variablePattern.exec(template)) !== null) {
            const variable = match[1].trim();
            if (variable && !variables.includes(variable)) {
                variables.push(variable);
            }
        }

        return variables;
    }

    sanitizeTemplate(template: string): string {
        if (!template || typeof template !== 'string') {
            return '';
        }

        let sanitized = template;

        // Удаляем потенциально опасные HTML теги
        sanitized = sanitized.replace(
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            '',
        );
        sanitized = sanitized.replace(
            /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
            '',
        );
        sanitized = sanitized.replace(
            /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
            '',
        );
        sanitized = sanitized.replace(/<embed\b[^<]*>/gi, '');

        // Удаляем лишние пробелы и переносы строк
        sanitized = sanitized.replace(/\s+/g, ' ').trim();

        this.logger.debug('Template sanitized successfully');
        return sanitized;
    }

    getSupportedSyntax(): string[] {
        return [...this.supportedSyntax];
    }

    private convertToString(value: unknown): string {
        if (value === null || value === undefined) {
            return '';
        }

        if (typeof value === 'string') {
            return value;
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            } catch (e) {
                this.logger.warn(
                    `Could not stringify object for template rendering: ${e}`,
                );
                return '[Object]';
            }
        }

        return '';
    }

    private validateSyntax(template: string): string[] {
        const errors: string[] = [];

        // Проверяем на незакрытые переменные
        const openBraces = (template.match(/\{\{/g) || []).length;
        const closeBraces = (template.match(/\}\}/g) || []).length;

        if (openBraces !== closeBraces) {
            errors.push('Несбалансированные фигурные скобки в шаблоне');
        }

        // Проверяем на пустые переменные
        const emptyVariables = template.match(/\{\{\s*\}\}/g);
        if (emptyVariables) {
            errors.push('Найдены пустые переменные в шаблоне');
        }

        return errors;
    }
}
