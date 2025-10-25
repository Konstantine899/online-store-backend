# 🔒 Security Documentation

## Аутентификация и авторизация

### JWT токены

- **Access Token**: короткий (15 минут), для API запросов
- **Refresh Token**: длинный (30 дней), только в HttpOnly cookies
- **Ротация**: новый refresh token при каждом обновлении
- **Хэширование**: bcrypt для паролей с достаточной сложностью

### Passport стратегии

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly userService: UserService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: JwtSettings().jwtSecretKey,
        });
    }
}
```

### Guards (защитники)

#### AuthGuard

- Извлечение токена из заголовка `Authorization: Bearer`
- Декодирование access токена через TokenService
- Установка пользователя в request объект
- Обработка ошибок: 401 для отсутствия токена, 403 для невалидного

#### RoleGuard

- Кэширование Set ролей для производительности
- Проверка ролей пользователя через Reflector
- Поддержка множественных ролей
- Обработка ошибок: 401 для неавторизованных, 403 для недостаточных прав

#### Детальные оптимизации Guards

**RoleGuard кэширование:**
```typescript
export class RoleGuard implements CanActivate {
    private static readonly BEARER_PREFIX = 'Bearer ';
    private static readonly UNAUTHORIZED_MESSAGE = 'Пользователь не авторизован';
    private static readonly FORBIDDEN_MESSAGE = 'У вас недостаточно прав доступа';
    
    // Кэширование Set ролей для O(1) доступа
    private readonly roleSetsCache = new Map<string, Set<string>>();
    
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );
        
        // Если роли не найдены, endpoint доступен для всех
        if (!requiredRoles) {
            return true;
        }
        
        // Проверка авторизации и ролей...
    }
}
```

**BruteforceGuard кэширование:**
```typescript
interface CachedConfig {
    loginWindowMs: number;
    loginLimit: number;
    refreshWindowMs: number;
    refreshLimit: number;
    regWindowMs: number;
    regLimit: number;
}

export class BruteforceGuard extends ThrottlerGuard {
    // Кэширование конфигурации на 30 секунд
    private cachedConfig: CachedConfig | null = null;
    private configCacheExpiry = 0;
    
    // Предкомпилированные regex для валидации IP
    private static readonly IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    private static readonly IPV6_REGEX = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    // Автоматический cleanup истёкших счётчиков
    private cleanupExpiredCounters(): void {
        const now = Date.now();
        for (const [key, data] of this.counterMap.entries()) {
            if (data.expiresAt < now) {
                this.counterMap.delete(key);
            }
        }
    }
}
```

#### BruteforceGuard

- Кэширование конфигурации на 30 секунд
- Автоматический cleanup истёкших счётчиков
- Специальные лимиты для auth endpoints
- Маскирование IP в логах для GDPR
- Retry-After заголовок при превышении лимита

## Валидация и санитизация

### Кастомные валидаторы

#### IsSanitizedString

- Удаление лишних пробелов и HTML тегов
- Проверка на подозрительные XSS паттерны
- Защита от `<script>`, `javascript:`, `on*=` атак
- Сообщение: "Строка содержит недопустимые символы или HTML теги"

#### IsPasswordStrong

- Минимум 8 символов
- Заглавные и строчные буквы
- Цифры и специальные символы
- Запрет простых паролей (password, 123456, qwerty, etc.)
- Сообщение: "Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные символы. Простые пароли запрещены"

#### IsValidPhone

- От 7 до 15 цифр
- Поддержка префикса `+`
- Нормализация пробелов, дефисов, скобок
- Сообщение: "Номер телефона должен содержать от 7 до 15 цифр и может начинаться с +"

#### IsValidName

- От 2 до 100 символов
- Только буквы, пробелы, дефисы, апострофы
- Поддержка кириллицы и латиницы
- Сообщение: "Имя должно содержать от 2 до 100 символов, только буквы, пробелы, дефисы и апострофы"

### PaginationValidator

- `validateSort(sort, defaultSort)` - валидация направления сортировки (ASC/DESC)
- `validateLimit(limit, defaultLimit, maxLimit)` - ограничение лимита записей (1-100)
- `validateOffset(offset)` - валидация смещения записей (≥0)
- Defence in depth для SQL запросов

#### Детальная валидация

**CustomValidationPipe с детальными настройками:**
```typescript
@Injectable()
export class CustomValidationPipe implements PipeTransform<TValue, Promise<ICustomValidationPipe[] | TValue>> {
    public async transform(
        value: TValue,
        { metatype }: ArgumentMetadata,
    ): Promise<ICustomValidationPipe[] | TValue> {
        if (!metatype || !this.validateMetaType(metatype)) {
            return value;
        }

        const object = plainToInstance(metatype, value, {
            enableImplicitConversion: false,
            excludeExtraneousValues: false,
        });

        const errors = await validate(object, {
            whitelist: true,                    // Только разрешенные поля
            forbidNonWhitelisted: true,         // Запрет неразрешенных полей
            forbidUnknownValues: true,         // Запрет неизвестных значений
            skipMissingProperties: false,       // Проверка всех свойств
            validationError: {
                target: false,                 // Не включать target в ошибки
                value: true,                   // Включать value в ошибки
            },
        });

        if (errors.length > 0) {
            const formatErrors: ICustomValidationPipe[] = this.formatValidationErrors(errors);
            throw new HttpException(formatErrors, HttpStatus.BAD_REQUEST);
        }
        return value;
    }

    private formatValidationErrors(errors: ValidationError[]): ICustomValidationPipe[] {
        return errors.map((error) => ({
            status: HttpStatus.BAD_REQUEST,
            property: error.property,
            messages: Object.values(error.constraints || {}),
            value: error.value,
        }));
    }
}
```

**PaginationValidator с конкретными методами:**
```typescript
export class PaginationValidator {
    static validateSort(sort: string | undefined, defaultSort: string): string {
        if (!sort) return defaultSort;
        
        const normalizedSort = sort.toUpperCase();
        if (normalizedSort !== 'ASC' && normalizedSort !== 'DESC') {
            return defaultSort;
        }
        
        return normalizedSort;
    }

    static validateLimit(limit: number | undefined, defaultLimit: number, maxLimit: number): number {
        if (!limit || limit <= 0) return defaultLimit;
        if (limit > maxLimit) return maxLimit;
        return limit;
    }

    static validateOffset(offset: number | undefined): number {
        if (!offset || offset < 0) return 0;
        return offset;
    }
}
```

## Rate Limiting

### Конфигурация лимитов

```typescript
const rateLimits = {
    login: '5 попыток/15мин',
    refresh: '10 попыток/5мин',
    registration: '3 попытки/мин',
};
```

### Глобальные лимиты

- **RPS**: 3 запроса в секунду
- **RPM**: 100 запросов в минуту
- **RPH**: 1000 запросов в час

### Специальные профили

- **Login**: 5 попыток в 15 минут
- **Refresh**: 10 попыток в 5 минут
- **Registration**: 3 попытки в минуту

## HTTP безопасность

### Helmet

```typescript
helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
});
```

### CORS

- Строго необходимые origins из `ALLOWED_ORIGINS` env переменной
- Настройка разрешенных методов и заголовков
- Поддержка credentials для аутентификации

### Cookie Parser

- Секретный ключ `COOKIE_PARSER_SECRET_KEY`
- Подпись cookies для защиты от подделки
- HttpOnly флаг для предотвращения XSS

### Content Security Policy

- Рекомендуется для дополнительной защиты
- Настройка через `SECURITY_CSP_ENABLED`

## Файловая безопасность

### FileInterceptor

- Ограничения размера и типов файлов
- Проверка MIME типов
- Защита от Path Traversal атак
- Защита от MIME spoofing

### Multer конфигурация

- **Разрешенные MIME типы**: image/jpeg, image/png, image/gif, image/webp
- **Разрешенные расширения**: .jpg, .jpeg, .png, .gif, .webp
- **Максимальный размер**: 256 KB
- **Path Traversal**: защита от `../../etc/passwd` атак
- **MIME spoofing**: проверка реального типа файла

## Логирование и мониторинг

### PII маскирование

```typescript
const maskPII = (data: any): any => {
    // Маскирование email, телефонов, токенов
    // Удаление паролей и секретов
};
```

#### Детальные PII маскирование

**PII_REDACT_PATHS - полный список полей для маскирования:**
```typescript
const PII_REDACT_PATHS = [
    // Токены и авторизация
    'authorization',
    'token',
    'accessToken',
    'refreshToken',
    'cookie',
    'password',
    'secret',
    'apiKey',
    // PII данные
    'email',
    'phone',
    'firstName',
    'lastName',
    'name',
    'address',
    'ip', // IP адреса маскируем для GDPR
    // Вложенные объекты
    '*.password',
    '*.token',
    '*.email',
    '*.phone',
    'user.email',
    'user.phone',
    'req.body.password',
    'req.body.email',
    'req.body.phone',
] as const;
```

**Функции маскирования:**
```typescript
// Маскирование строковых данных
export function maskPII(data: string | undefined | null): string {
    if (!data || data.length <= 4) {
        return '[REDACTED]';
    }
    
    return `${data.substring(0, 2)}***${data.substring(data.length - 2)}`;
}

// Безопасное логирование объекта с автоматическим удалением PII полей
export function sanitizeForLogging<T extends Record<string, unknown>>(
    obj: T,
): Partial<T> {
    const sanitized: Partial<T> = {};
    const PII_FIELDS = new Set([
        'password', 'token', 'accessToken', 'refreshToken',
        'email', 'phone', 'firstName', 'lastName', 'address',
        'secret', 'apiKey',
    ]);
    
    for (const [key, value] of Object.entries(obj)) {
        if (PII_FIELDS.has(key)) {
            sanitized[key as keyof T] = '[REDACTED]' as T[keyof T];
        } else if (Array.isArray(value)) {
            // Рекурсивная обработка массивов
            sanitized[key as keyof T] = value.map((item) =>
                typeof item === 'object' && item !== null
                    ? sanitizeForLogging(item as Record<string, unknown>)
                    : item,
            ) as T[keyof T];
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key as keyof T] = sanitizeForLogging(
                value as Record<string, unknown>,
            ) as T[keyof T];
        } else {
            sanitized[key as keyof T] = value as T[keyof T];
        }
    }
    
    return sanitized;
}
```

**Singleton base logger для производительности:**
```typescript
// Singleton base logger (создаётся один раз)
let baseLogger: pino.Logger | null = null;

function getBaseLogger(): pino.Logger {
    if (!baseLogger) {
        baseLogger = pino(createPinoConfig());
    }
    return baseLogger;
}

// Создание child logger с correlation ID
export function createLogger(context: string, correlationId?: string): pino.Logger {
    const base = getBaseLogger();
    const child = base.child({ context });
    
    if (correlationId) {
        return child.child({ correlationId });
    }
    
    return child;
}
```

### Correlation ID

- Генерация уникального `x-request-id` для каждого запроса
- Пробрасывание существующего ID из заголовка
- Добавление ID в response headers для клиента
- Использование `randomUUID()` для генерации

### Структурированные логи

- JSON формат для production
- Pretty printing для development
- Уровни: info, warn, error
- Включение correlation ID во все логи

## Управление секретами

### Environment переменные

- **Валидация**: проверка силы секретов в production/staging
- **Ротация**: предупреждения о необходимости смены секретов
- **Версионирование**: отслеживание версий секретов
- **Кэширование**: ленивая инициализация для производительности

#### Детальная валидация переменных окружения

**WEAK_SECRET_PATTERNS для проверки слабых секретов:**
```typescript
const WEAK_SECRET_PATTERNS = [
    'change-me',
    'please_change_me',
    'replace-with-strong-secret',
    'secret',
    'password',
    'test',
] as const;
```

**Функция проверки ротации секретов:**
```typescript
function checkSecretRotation(rotationDate: string | undefined, env: string): void {
    if (!rotationDate || (env !== 'production' && env !== 'staging')) {
        return;
    }
    
    const rotation = new Date(rotationDate);
    const now = new Date();
    
    if (now.getTime() > rotation.getTime()) {
        console.warn(
            `⚠️  ВНИМАНИЕ: Секреты JWT должны быть ротированы! Дата ротации: ${rotationDate}`,
        );
    }
}
```

**Детальная валидация секретов:**
```typescript
function requiredSecret(value: string | undefined, name: string, minLength: number, env: string): string {
    if (!value || value.trim().length === 0) {
        throw new Error(`Переменная ${name} обязательна и не может быть пустой`);
    }
    
    const trimmed = value.trim();
    
    // В production и staging требуем сильные секреты
    if (env === 'production' || env === 'staging') {
        if (trimmed.length < minLength) {
            throw new Error(
                `Секрет ${name} в ${env} окружении должен содержать минимум ${minLength} символов`,
            );
        }
        
        // Проверка на слабые паттерны
        if (WEAK_SECRET_PATTERNS.some(pattern => trimmed.toLowerCase().includes(pattern))) {
            throw new Error(`Секрет ${name} содержит слабый паттерн: ${pattern}`);
        }
    }
    
    return trimmed;
}
```

### Секреты JWT

- **Минимальная длина**: 32 символа для production
- **Проверка слабости**: запрет простых паттернов
- **Ротация**: автоматические предупреждения
- **Версионирование**: отслеживание изменений

#### Детальная безопасность токенов

**Ленивая инициализация секретов:**
```typescript
// Ленивая инициализация конфигурации/секретов — чтобы не требовать env при импорте
let CACHED_ACCESS_SECRET: string | undefined;
function getAccessSecret(): string {
    if (!CACHED_ACCESS_SECRET) {
        CACHED_ACCESS_SECRET = JwtSettings().jwtSecretKey;
    }
    return CACHED_ACCESS_SECRET;
}

let CACHED_REFRESH_TTL_SECONDS: number | undefined;
function getRefreshTtlSeconds(): number {
    if (!CACHED_REFRESH_TTL_SECONDS) {
        CACHED_REFRESH_TTL_SECONDS = parseDuration(JwtSettings().jwtRefreshTtl);
    }
    return CACHED_REFRESH_TTL_SECONDS;
}
```

**Ротация refresh токенов с безопасностью:**
```typescript
public async rotateRefreshToken(
    encodedRefreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; user: UserModel }> {
    const payload = await this.decodeRefreshToken(encodedRefreshToken);
    const userId = Number(payload.sub);
    const tokenId = Number(payload.jti);

    if (!userId || !tokenId) {
        throw new UnprocessableEntityException('Invalid refresh token payload');
    }

    // Ищем токен в БД
    const storedToken = await this.refreshTokenRepository.findRefreshTokenById(tokenId);

    if (!storedToken) {
        // Удаляем ВСЕ refresh токены пользователя для безопасности
        await this.refreshTokenRepository
            .removeListRefreshTokens(userId)
            .catch(() => {
                // Игнорируем ошибки при удалении
            });
        throw new NotFoundException(
            'Refresh token not found or already used (possible theft detected)',
        );
    }

    // Проверяем, что токен принадлежит правильному пользователю
    if (storedToken.user_id !== userId) {
        throw new UnprocessableEntityException('Token user mismatch');
    }

    // Проверяем срок действия
    if (storedToken.expires && storedToken.expires <= new Date()) {
        await this.refreshTokenRepository.removeRefreshToken(tokenId);
        throw new UnprocessableEntityException('Refresh token expired');
    }

    // Удаляем старый токен
    await this.refreshTokenRepository.removeRefreshToken(tokenId);

    // Генерируем новые токены
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
        throw new NotFoundException('User not found');
    }

    const newAccessToken = await this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user, getRefreshTtlSeconds());

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user,
    };
}
```

**Безопасность при компрометации токенов:**
```typescript
public async removeRefreshToken(refreshTokenId: number, userId: number): Promise<number> {
    const listRefreshTokens = await this.refreshTokenRepository.findListRefreshTokens(userId);
    
    // Если у пользователя больше одного токена, удаляем все для безопасности
    if (listRefreshTokens.length > 1) {
        return this.refreshTokenRepository.removeListRefreshTokens(userId);
    }
    
    return this.refreshTokenRepository.removeRefreshToken(refreshTokenId);
}
```

### Cookie безопасность

- **HttpOnly**: предотвращение XSS атак
- **Secure**: только HTTPS в production
- **SameSite**: защита от CSRF
- **Signed**: подпись для защиты от подделки

#### Детальная конфигурация Cookie

**buildRefreshCookieOptions с кэшированием:**
```typescript
export function buildRefreshCookieOptions(): Readonly<{
    httpOnly: true;
    secure: boolean;
    sameSite: 'lax' | 'none';
    path: string;
    domain: string | undefined;
    signed: true;
    maxAge?: number;
}> {
    const base = getBaseCookieOptions();
    const maxAge = getRefreshMaxAge();
    
    return {
        ...base,
        maxAge,
    } as const;
}

// Ленивая инициализация, чтобы не трогать env на импорт
let CACHED_BASE_COOKIE_OPTIONS: Readonly<{
    httpOnly: true;
    secure: boolean;
    sameSite: 'lax' | 'none';
    path: string;
    domain: string | undefined;
    signed: true;
}> | undefined;

function getBaseCookieOptions() {
    if (!CACHED_BASE_COOKIE_OPTIONS) {
        const isProd = process.env.NODE_ENV === 'production';
        const sameSite: 'lax' | 'none' = isProd ? 'none' : 'lax';
        
        CACHED_BASE_COOKIE_OPTIONS = {
            httpOnly: true,
            secure: isProd,
            sameSite,
            path: '/online-store/',
            domain: undefined,
            signed: true,
        } as const;
    }
    return CACHED_BASE_COOKIE_OPTIONS;
}

let CACHED_REFRESH_MAX_AGE: number | undefined | null;

function getRefreshMaxAge(): number | undefined {
    if (CACHED_REFRESH_MAX_AGE === null) {
        return undefined;
    }
    
    if (CACHED_REFRESH_MAX_AGE === undefined) {
        const ttl = JwtSettings().jwtRefreshTtl;
        CACHED_REFRESH_MAX_AGE = parseDuration(ttl) * 1000; // в миллисекундах
    }
    
    return CACHED_REFRESH_MAX_AGE;
}
```

**Настройки для production/development:**
```typescript
// Production: строгие настройки безопасности
const productionCookieOptions = {
    httpOnly: true,
    secure: true,        // Только HTTPS
    sameSite: 'none',   // Для cross-origin запросов
    path: '/online-store/',
    signed: true,       // Подпись для защиты от подделки
};

// Development: более мягкие настройки для разработки
const developmentCookieOptions = {
    httpOnly: true,
    secure: false,       // HTTP разрешен
    sameSite: 'lax',    // Более мягкая политика
    path: '/online-store/',
    signed: true,       // Подпись все равно нужна
};
```

## Exception Filters

### CustomNotFoundExceptionFilter

- Подробная информация о 404 ошибках
- URL, path, name, message
- Русские сообщения об ошибках

### SequelizeDatabaseErrorExceptionFilter

- Маппинг ошибок БД в понятные сообщения
- Добавление timestamp для отладки
- Скрытие внутренних деталей БД

### SequelizeUniqueConstraintExceptionFilter

- Обработка конфликтов уникальности
- Возврат 409 Conflict
- Указание поля конфликта

### CartBusinessLogicExceptionFilter

- Обработка бизнес-ошибок корзины
- Детальные сообщения на русском языке
- Логирование для мониторинга

### CartValidationExceptionFilter

- Валидация данных корзины
- Проверка бизнес-правил
- Предотвращение некорректных операций

## Мониторинг безопасности

### Метрики

- Количество блокировок по IP
- Подозрительные паттерны запросов
- Аномальная активность аккаунтов
- Частые 401/403/429 ошибки

### Алерты

- Множественные неудачные попытки входа
- Подозрительные паттерны доступа
- Превышение rate limits
- Компрометация токенов

### Логирование

- Структурированные JSON логи
- Маскирование PII данных
- Correlation ID для трассировки
- Уровни логирования по критичности

## Конкретные измерения безопасности

### Производительность Guards

**RoleGuard кэширование:**
- **Кэш ролей**: Map<string, Set<string>> для O(1) доступа
- **Статические константы**: BEARER_PREFIX, UNAUTHORIZED_MESSAGE, FORBIDDEN_MESSAGE
- **Избежание повторных вычислений**: кэширование Set ролей

**BruteforceGuard оптимизации:**
- **Кэш конфигурации**: 30 секунд TTL для CachedConfig
- **Предкомпилированные regex**: IPV4_REGEX, IPV6_REGEX
- **Автоматический cleanup**: удаление истёкших счётчиков
- **Маскирование IP**: для GDPR compliance

### Безопасность токенов

**Ленивая инициализация:**
- **CACHED_ACCESS_SECRET**: кэширование JWT секрета
- **CACHED_REFRESH_TTL_SECONDS**: кэширование TTL
- **Избежание повторных вызовов**: JwtSettings() и parseDuration()

**Ротация токенов:**
- **Проверка принадлежности**: storedToken.user_id === userId
- **Проверка срока действия**: storedToken.expires <= new Date()
- **Безопасность при компрометации**: удаление ВСЕХ токенов пользователя
- **Валидация payload**: userId и tokenId обязательны

### PII маскирование

**PII_REDACT_PATHS:**
- **Токены**: authorization, token, accessToken, refreshToken, cookie, password, secret, apiKey
- **PII данные**: email, phone, firstName, lastName, name, address, ip
- **Вложенные объекты**: *.password, *.token, *.email, *.phone, user.email, user.phone
- **Request body**: req.body.password, req.body.email, req.body.phone

**Функции маскирования:**
- **maskPII**: маскирование строк (первые 2 + последние 2 символа)
- **sanitizeForLogging**: рекурсивная обработка объектов и массивов
- **PII_FIELDS Set**: O(1) проверка полей для маскирования

### Cookie безопасность

**Кэширование опций:**
- **CACHED_BASE_COOKIE_OPTIONS**: кэширование базовых настроек
- **CACHED_REFRESH_MAX_AGE**: кэширование TTL в миллисекундах
- **Ленивая инициализация**: создание только при первом использовании

**Настройки по окружениям:**
- **Production**: secure: true, sameSite: 'none', signed: true
- **Development**: secure: false, sameSite: 'lax', signed: true
- **Path**: '/online-store/' для изоляции

### Валидация

**CustomValidationPipe:**
- **whitelist: true**: только разрешенные поля
- **forbidNonWhitelisted: true**: запрет неразрешенных полей
- **forbidUnknownValues: true**: запрет неизвестных значений
- **skipMissingProperties: false**: проверка всех свойств

**PaginationValidator:**
- **validateSort**: нормализация ASC/DESC
- **validateLimit**: ограничение 1-100 записей
- **validateOffset**: проверка ≥0
