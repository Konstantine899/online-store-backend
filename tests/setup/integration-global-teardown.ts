/**
 * Global teardown для integration тестов
 * Выполняется ОДИН РАЗ после завершения всех integration тестов
 *
 * Задача: опциональная очистка после тестов (если нужно)
 * Сейчас оставляем пустым, т.к. resetDatabase в setup уже очищает БД
 */
export default async function globalTeardown(): Promise<void> {
    // Опционально: можно добавить cleanup здесь, если нужно
    // Но обычно resetDatabase в setup уже всё очищает
    console.log('✅ [Integration Global Teardown] Test suite completed');
}
