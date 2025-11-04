/**
 * Утилиты для работы с телефонными номерами
 * Содержит общую логику для валидации и нормализации номеров
 */

/**
 * Константы для длин телефонных номеров
 */
export const PHONE_CONSTANTS = {
    /** Длина российского номера телефона (11 цифр) */
    RUSSIAN_PHONE_LENGTH: 11,
    /** Минимальная длина международного номера (7 цифр) */
    MIN_INTERNATIONAL_LENGTH: 7,
    /** Максимальная длина международного номера (15 цифр) */
    MAX_INTERNATIONAL_LENGTH: 15,
    /** Максимальная длина номера с учетом форматирования (пробелы, дефисы, скобки) */
    MAX_FORMATTED_LENGTH: 20,
} as const;

/**
 * Проверяет, является ли номер российским форматом
 * Российский номер: 11 цифр, начинается с 7 или 8
 *
 * @param cleanPhone - очищенный номер (только цифры)
 * @returns true, если номер российского формата
 */
export function isRussianPhoneFormat(cleanPhone: string): boolean {
    return (
        cleanPhone.length === PHONE_CONSTANTS.RUSSIAN_PHONE_LENGTH &&
        (cleanPhone.startsWith('7') || cleanPhone.startsWith('8')) &&
        /^[78]\d{10}$/.test(cleanPhone)
    );
}

/**
 * Очищает номер телефона от форматирования (пробелы, дефисы, скобки)
 *
 * @param phone - исходный номер телефона
 * @returns очищенный номер (только цифры и +)
 */
export function cleanPhoneNumber(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
}

/**
 * Нормализует российский номер телефона в формат +7
 * Российские номера (8 или 7) приводятся к формату +7
 *
 * @param cleanPhone - очищенный номер (только цифры, без +)
 * @returns нормализованный номер в формате +7XXXXXXXXXX или исходный номер, если не российский
 */
export function normalizeRussianPhone(cleanPhone: string): string {
    if (isRussianPhoneFormat(cleanPhone)) {
        // Нормализуем: 8XXXXXXXXXX или 7XXXXXXXXXX -> +7XXXXXXXXXX
        return `+7${cleanPhone.slice(1)}`;
    }
    return cleanPhone;
}
