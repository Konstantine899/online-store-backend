/**
 * Конфигурация для системы верификации email/телефона
 * Содержит константы времени жизни кодов и лимитов попыток
 */

/**
 * Время жизни кода верификации в миллисекундах
 * По умолчанию: 10 минут
 */
export const VERIFICATION_CODE_EXPIRY_MS = 10 * 60 * 1000;

/**
 * Максимальное количество попыток ввода кода верификации
 * По умолчанию: 5 попыток
 */
export const VERIFICATION_CODE_MAX_ATTEMPTS = 5;

/**
 * Длина генерируемого кода в байтах (hex)
 * 3 байта = 6 hex символов
 */
export const VERIFICATION_CODE_LENGTH_BYTES = 3;

/**
 * Cooldown период между запросами кодов верификации
 * Пользователь не может запросить новый код, пока не истечет cooldown
 * По умолчанию: 60 секунд (1 минута)
 *
 * Конфигурируется через переменную окружения VERIFICATION_CODE_COOLDOWN_MS
 * Для тестов рекомендуется использовать 100ms для быстрого выполнения
 *
 * Реализовано как функция для поддержки динамического изменения в тестах
 */
export const getVerificationCodeCooldownMs = (): number => {
    return parseInt(process.env.VERIFICATION_CODE_COOLDOWN_MS ?? '60000', 10);
};

/**
 * @deprecated Используйте getVerificationCodeCooldownMs() для поддержки динамической конфигурации
 */
export const VERIFICATION_CODE_COOLDOWN_MS = getVerificationCodeCooldownMs();
