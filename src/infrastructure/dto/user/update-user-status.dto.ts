/**
 * DTO для обновления статусных флагов пользователя
 * ⚠️ ВАЖНО: все статусные поля (isPremium, isVipCustomer, isBetaTester) УДАЛЕНЫ из UserModel
 * Endpoint оставлен для обратной совместимости, но не принимает никаких параметров
 */
export class UpdateUserStatusDto {
    // Все поля удалены - endpoint deprecated, оставлен для обратной совместимости
}
