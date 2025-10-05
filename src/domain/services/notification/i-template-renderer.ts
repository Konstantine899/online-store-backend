export interface TemplateVariables {
    [key: string]: string | number | boolean | Date | object;
}

export interface RenderResult {
    success: boolean;
    content?: string;
    error?: string;
    variables?: string[];
    missingVariables?: string[];
}

export interface ITemplateRenderer {
    renderTemplate(template: string, variables: TemplateVariables): Promise<RenderResult>;
    validateTemplate(template: string): { valid: boolean; errors: string[]; variables: string[] };
    extractVariables(template: string): string[];
    sanitizeTemplate(template: string): string;
    getSupportedSyntax(): string[];
}
