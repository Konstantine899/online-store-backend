/**
 * Утилита для экспорта данных в CSV формат
 */
export class CSVExporter {
    /**
     * Экспортировать массив объектов в CSV строку
     * @param data - массив объектов для экспорта
     * @param headers - массив заголовков (опционально, если не указаны - берутся из первого объекта)
     * @returns CSV строка
     */
    static export(data: Record<string, unknown>[], headers?: string[]): string {
        if (data.length === 0) {
            return '';
        }

        // Определить заголовки
        const csvHeaders =
            headers ?? Object.keys(data[0]).filter((key) => key !== 'diff');

        // Создать CSV строку с заголовками
        const csvRows: string[] = [
            csvHeaders.map((h) => this.escapeCsvValue(h)).join(','),
        ];

        // Добавить строки данных
        data.forEach((row) => {
            const values = csvHeaders.map((header) => {
                const value = row[header];
                return this.escapeCsvValue(this.formatValue(value));
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }

    /**
     * Экранировать значение для CSV
     * @param value - значение для экранирования
     * @returns экранированная строка
     */
    private static escapeCsvValue(value: unknown): string {
        if (value === null || value === undefined) {
            return '';
        }

        const stringValue = String(value);

        // Если содержит запятую, кавычки или перенос строки - обернуть в кавычки
        if (
            stringValue.includes(',') ||
            stringValue.includes('"') ||
            stringValue.includes('\n') ||
            stringValue.includes('\r')
        ) {
            // Удвоить кавычки для экранирования
            return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
    }

    /**
     * Форматировать значение для CSV
     * @param value - значение для форматирования
     * @returns отформатированная строка
     */
    private static formatValue(value: unknown): string {
        if (value === null || value === undefined) {
            return '';
        }

        // Если объект или массив - сериализовать в JSON
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }

        // Если дата - форматировать в ISO строку
        if (value instanceof Date) {
            return value.toISOString();
        }

        return String(value);
    }

    /**
     * Экспортировать audit логи в CSV
     * @param auditLogs - массив audit логов
     * @returns CSV строка
     */
    static exportAuditLogs(
        auditLogs: Array<{
            id: number;
            entityType: string;
            entityId: number;
            action: string;
            userId: number | null;
            userName?: string | null;
            userEmail?: string | null;
            createdAt: Date;
            ipAddress: string | null;
            requestId: string | null;
            tenantId: number | null;
        }>,
    ): string {
        const csvData = auditLogs.map((log) => ({
            ID: log.id,
            'Entity Type': log.entityType,
            'Entity ID': log.entityId,
            Action: log.action,
            'User ID': log.userId ?? '',
            'User Name': log.userName ?? '',
            'User Email': log.userEmail ?? '',
            'Created At': log.createdAt.toISOString(),
            'IP Address': log.ipAddress ?? '',
            'Request ID': log.requestId ?? '',
            'Tenant ID': log.tenantId ?? '',
        }));

        return this.export(csvData);
    }
}
