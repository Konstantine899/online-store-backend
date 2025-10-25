import {
    ITemplateRenderer,
    RenderResult,
    TemplateVariables,
} from '@app/domain/services';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TemplateRendererService implements ITemplateRenderer {
    private readonly logger = new Logger(TemplateRendererService.name);
    private readonly supportedSyntax = ['{{variable}}'];

    // Кэш для валидации шаблонов
    private readonly templateValidationCache = new Map<
        string,
        { valid: boolean; errors: string[]; variables: string[] }
    >();
    private readonly maxCacheSize = 500;

    // Кэш для извлеченных переменных
    private readonly variablesCache = new Map<string, string[]>();
    private readonly variablesCacheTimeout = 10 * 60 * 1000; // 10 минут

    // Предкомпилированные регулярные выражения
    private readonly variablePattern = /\{\{([^}]+)\}\}/g;
    private readonly openBracesPattern = /\{\{/g;
    private readonly closeBracesPattern = /\}\}/g;
    private readonly emptyVariablesPattern = /\{\{\s*\}\}/g;
    private readonly scriptPattern =
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    private readonly iframePattern =
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
    private readonly objectPattern =
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi;
    private readonly embedPattern = /<embed\b[^<]*>/gi;
    private readonly whitespacePattern = /\s+/g;

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

            // Извлекаем переменные из шаблона (с кэшированием)
            const templateVariables = this.extractVariables(template);
            const missingVariables: string[] = [];
            const usedVariables: string[] = [];

            // Оптимизированная проверка переменных
            const providedSet = new Set(Object.keys(variables));

            for (const variable of templateVariables) {
                if (providedSet.has(variable)) {
                    usedVariables.push(variable);
                } else {
                    missingVariables.push(variable);
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

            // Оптимизированный рендеринг шаблона
            const renderedContent = this.renderTemplateOptimized(
                template,
                variables,
                usedVariables,
            );

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

            // Проверяем кэш валидации только после проверки на null
            const cacheKey = this.getTemplateHash(template);
            const cached = this.templateValidationCache.get(cacheKey);
            if (cached) {
                return cached;
            }

            // Извлекаем переменные (с кэшированием)
            const extractedVariables = this.extractVariables(template);
            variables.push(...extractedVariables);

            // Проверяем синтаксис
            const syntaxErrors = this.validateSyntax(template);
            errors.push(...syntaxErrors);

            const result = {
                valid: errors.length === 0,
                errors,
                variables,
            };

            // Кэшируем результат
            this.setCacheValue(
                this.templateValidationCache,
                cacheKey,
                result,
                this.maxCacheSize,
            );

            return result;
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

        // Проверяем кэш переменных
        const cacheKey = this.getTemplateHash(template);
        const cached = this.variablesCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const variables: string[] = [];
        const variableSet = new Set<string>(); // Используем Set для быстрой проверки уникальности

        // Сбрасываем lastIndex для глобального regex
        this.variablePattern.lastIndex = 0;
        let match;

        while ((match = this.variablePattern.exec(template)) !== null) {
            const variable = match[1].trim();
            if (variable && !variableSet.has(variable)) {
                variableSet.add(variable);
                variables.push(variable);
            }
        }

        // Кэшируем результат
        this.setCacheValue(
            this.variablesCache,
            cacheKey,
            variables,
            this.maxCacheSize,
        );

        return variables;
    }

    sanitizeTemplate(template: string): string {
        if (!template || typeof template !== 'string') {
            return '';
        }

        let sanitized = template;

        // Используем предкомпилированные регулярные выражения
        sanitized = sanitized.replace(this.scriptPattern, '');
        sanitized = sanitized.replace(this.iframePattern, '');
        sanitized = sanitized.replace(this.objectPattern, '');
        sanitized = sanitized.replace(this.embedPattern, '');

        // Удаляем лишние пробелы и переносы строк
        sanitized = sanitized.replace(this.whitespacePattern, ' ').trim();

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

        // Используем предкомпилированные регулярные выражения
        const openBraces = (template.match(this.openBracesPattern) ?? [])
            .length;
        const closeBraces = (template.match(this.closeBracesPattern) ?? [])
            .length;

        if (openBraces !== closeBraces) {
            errors.push('Несбалансированные фигурные скобки в шаблоне');
        }

        // Проверяем на пустые переменные
        const emptyVariables = template.match(this.emptyVariablesPattern);
        if (emptyVariables) {
            errors.push('Найдены пустые переменные в шаблоне');
        }

        return errors;
    }

    // Вспомогательные методы для оптимизации
    private renderTemplateOptimized(
        template: string,
        variables: TemplateVariables,
        usedVariables: string[],
    ): string {
        let renderedContent = template;

        // Оптимизированный рендеринг: обрабатываем только используемые переменные
        for (const variable of usedVariables) {
            const placeholder = `{{${variable}}}`;
            const stringValue = this.convertToString(variables[variable]);

            // Используем предкомпилированный regex для замены
            const regex = new RegExp(
                placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                'g',
            );
            renderedContent = renderedContent.replace(regex, stringValue);
        }

        return renderedContent;
    }

    private getTemplateHash(template: string): string {
        // Проверяем на null/undefined
        if (!template || typeof template !== 'string') {
            return 'null-template';
        }

        // Простой хэш для кэширования (в реальной реализации можно использовать crypto)
        let hash = 0;
        for (let i = 0; i < template.length; i++) {
            const char = template.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }

    private setCacheValue<T>(
        cache: Map<string, T>,
        key: string,
        value: T,
        maxSize: number,
    ): void {
        // Очищаем кэш при достижении лимита
        if (cache.size >= maxSize) {
            const firstKey = cache.keys().next().value;
            if (firstKey !== undefined) {
                cache.delete(firstKey);
            }
        }
        cache.set(key, value);
    }
}
