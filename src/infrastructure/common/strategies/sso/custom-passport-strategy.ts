import passport from 'passport';
import { Strategy as BaseStrategy } from 'passport-strategy';

// Сохраняем ссылку на прототип BaseStrategy для прямого доступа к методам error/fail/success
// КРИТИЧНО: При Object.create(prototype) методы могут быть недоступны через цепочку прототипов,
// поэтому используем прямой доступ к BaseStrategy.prototype
const BaseStrategyProto = BaseStrategy.prototype;

/**
 * Кастомная Passport стратегия, совместимая с PassportStrategy из NestJS
 *
 * Создана как альтернатива passport-custom для решения проблем с _verify
 * при использовании Object.create(prototype) в passport.authenticate.
 *
 * Особенности:
 * - Полная совместимость с PassportStrategy из @nestjs/passport
 * - Правильная работа с Object.create(prototype)
 * - _verify устанавливается на прототипе для доступности во всех экземплярах
 * - Поддержка динамической конфигурации
 *
 * Использование:
 * - Используется как базовая стратегия для OAuth2 и OIDC SSO
 * - PassportStrategy передает callback последним аргументом в super()
 * - Эта стратегия извлекает callback и устанавливает его как _verify
 */
export class CustomPassportStrategy extends BaseStrategy {
    // КРИТИЧНО: Переопределяем методы error, fail, success на прототипе
    // для гарантии их доступности при Object.create(prototype)
    // Это защита от ошибок "Cannot read properties of undefined (reading 'error')"

    // КРИТИЧНО: Флаг инициализации методов на прототипе
    private static protoMethodsInitialized = false;

    /**
     * Инициализирует методы error/fail/success на прототипе
     * Гарантирует их доступность при Object.create(prototype)
     */
    private static initializeProtoMethods(): void {
        if (CustomPassportStrategy.protoMethodsInitialized) {
            return;
        }

        const proto = CustomPassportStrategy.prototype;

        // Методы уже определены в классе, но убеждаемся что они доступны на прототипе
        // TypeScript автоматически устанавливает методы на прототипе, но для надежности
        // проверяем их наличие
        if (!proto.error || typeof proto.error !== 'function') {
            console.warn(
                '[CustomPassportStrategy] error method not found on prototype',
            );
        }
        if (!proto.fail || typeof proto.fail !== 'function') {
            console.warn(
                '[CustomPassportStrategy] fail method not found on prototype',
            );
        }
        if (!proto.success || typeof proto.success !== 'function') {
            console.warn(
                '[CustomPassportStrategy] success method not found on prototype',
            );
        }

        // Помечаем как инициализированное
        CustomPassportStrategy.protoMethodsInitialized = true;
    }

    public error(err: Error): void {
        // Пробуем вызвать через BaseStrategy.prototype
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
            const passportStrategyModule = require('passport-strategy');
            const BaseStrategy = passportStrategyModule?.Strategy;
            if (
                BaseStrategy?.prototype?.error &&
                typeof BaseStrategy.prototype.error === 'function'
            ) {
                return BaseStrategy.prototype.error.call(this, err);
            }
        } catch {
            // Игнорируем ошибки require
        }
        // Fallback через модульную переменную
        if (
            BaseStrategyProto?.error &&
            typeof BaseStrategyProto.error === 'function'
        ) {
            return BaseStrategyProto.error.call(this, err);
        }
        // Если ничего не помогло, логируем ошибку
        console.error(
            '[CustomPassportStrategy.error] BaseStrategy.prototype.error not available',
            err,
        );
    }

    public fail(challenge?: unknown): void {
        // Пробуем вызвать через BaseStrategy.prototype
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
            const passportStrategyModule = require('passport-strategy');
            const BaseStrategy = passportStrategyModule?.Strategy;
            if (
                BaseStrategy?.prototype?.fail &&
                typeof BaseStrategy.prototype.fail === 'function'
            ) {
                // BaseStrategy.fail принимает challenge как string | number | undefined
                return BaseStrategy.prototype.fail.call(
                    this,
                    challenge as string | number | undefined,
                );
            }
        } catch {
            // Игнорируем ошибки require
        }
        // Fallback через модульную переменную
        if (
            BaseStrategyProto?.fail &&
            typeof BaseStrategyProto.fail === 'function'
        ) {
            // BaseStrategy.fail принимает challenge как string | number | undefined
            // Используем type assertion для совместимости
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (BaseStrategyProto.fail as any).call(this, challenge);
        }
        // Если ничего не помогло, логируем ошибку
        console.error(
            '[CustomPassportStrategy.fail] BaseStrategy.prototype.fail not available',
            challenge,
        );
    }

    public success(user: unknown, info?: unknown): void {
        // Пробуем вызвать через BaseStrategy.prototype
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
            const passportStrategyModule = require('passport-strategy');
            const BaseStrategy = passportStrategyModule?.Strategy;
            if (
                BaseStrategy?.prototype?.success &&
                typeof BaseStrategy.prototype.success === 'function'
            ) {
                return BaseStrategy.prototype.success.call(this, user, info);
            }
        } catch {
            // Игнорируем ошибки require
        }
        // Fallback через модульную переменную
        if (
            BaseStrategyProto?.success &&
            typeof BaseStrategyProto.success === 'function'
        ) {
            return BaseStrategyProto.success.call(this, user, info);
        }
        // Если ничего не помогло, логируем ошибку
        console.error(
            '[CustomPassportStrategy.success] BaseStrategy.prototype.success not available',
        );
    }

    // Статический Map для хранения callback по классу и по имени стратегии
    // Это гарантирует, что callback будет доступен даже при Object.create(prototype)
    // Экспортируем для доступа из ServicesModule
    public static readonly verifyCallbacks = new WeakMap<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any,
        (
            req: unknown,
            done: (error: Error | null, user?: unknown) => void,
        ) => void
    >();

    // Дополнительный Map по имени стратегии для случаев, когда конструктор не вызывается
    // Экспортируем для доступа из ServicesModule
    public static readonly verifyCallbacksByName = new Map<
        string,
        (
            req: unknown,
            done: (error: Error | null, user?: unknown) => void,
        ) => void
    >();

    // Map для экземпляров, которые были созданы без callback (через DI)
    // Используется для создания callback динамически из метода validate
    private static readonly pendingInstances = new WeakMap<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any,
        CustomPassportStrategy
    >();

    // КРИТИЧНО: Устанавливаем _verify на прототипе, чтобы он был доступен
    // при Object.create(prototype) в passport.authenticate
    public _verify?: (
        req: unknown,
        done: (error: Error | null, user?: unknown) => void,
    ) => void;

    // Свойство name наследуется от BaseStrategy, но TypeScript требует явного объявления
    // Инициализируется в конструкторе через Object.defineProperty
    public name!: string;

    constructor(...args: unknown[]) {
        // КРИТИЧНО: Инициализируем методы на прототипе при создании первого экземпляра
        CustomPassportStrategy.initializeProtoMethods();

        console.log(
            '[CustomPassportStrategy.constructor] CALLED with',
            args.length,
            'args',
        );
        super();

        // КРИТИЧНО: PassportStrategy вызывает: super(...args, callback)
        // Где args - это аргументы конструктора дочернего класса (например, DI зависимости),
        // а callback - это функция, созданная из validate метода, передается ПОСЛЕДНИМ аргументом
        // Поэтому callback всегда является последним элементом в args
        const callback = args[args.length - 1] as (
            req: unknown,
            done: (error: Error | null, user?: unknown) => void,
        ) => void;

        // КРИТИЧНО: Если callback не передан (при создании через DI),
        // мы создадим его динамически из метода validate при первом вызове authenticate
        // Это позволяет работать с PassportStrategy, который может не передавать callback в super()
        if (!callback || typeof callback !== 'function') {
            console.warn(
                `[CustomPassportStrategy] Callback not provided in constructor. Received ${args.length} args: ${args.map((arg) => typeof arg).join(', ')}. Will create callback dynamically from validate method.`,
            );
            // Не бросаем ошибку - создадим callback динамически
            // Сохраняем ссылку на экземпляр для создания callback позже
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Constructor = this.constructor as any;
            CustomPassportStrategy.pendingInstances.set(Constructor, this);
            return; // Выходим раньше, callback будет создан в authenticate
        }

        // КРИТИЧНО: Сохраняем callback в статическом Map по классу
        // Это гарантирует, что callback будет доступен даже при Object.create(prototype)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Constructor = this.constructor as any;

        console.log('[CustomPassportStrategy.constructor]', {
            constructorName: Constructor.name,
            argsLength: args.length,
            hasCallback: typeof callback,
        });

        // Сохраняем callback по конструктору
        CustomPassportStrategy.verifyCallbacks.set(Constructor, callback);

        // КРИТИЧНО: PassportStrategy устанавливает this.name ПОСЛЕ вызова super()
        // Используем имя стратегии из конструктора как fallback
        const strategyNameFromConstructor = Constructor.name
            .replace('SSOStrategy', '')
            .toLowerCase();
        if (
            strategyNameFromConstructor &&
            strategyNameFromConstructor !== 'custompassport'
        ) {
            CustomPassportStrategy.verifyCallbacksByName.set(
                strategyNameFromConstructor,
                callback,
            );
            console.log(
                '[CustomPassportStrategy.constructor] Saved callback by constructor name:',
                strategyNameFromConstructor,
            );
        }

        // Устанавливаем начальное имя стратегии
        // PassportStrategy перезапишет его после вызова super()
        let strategyName = 'custom';

        // КРИТИЧНО: Перехватываем установку this.name через Object.defineProperty
        // Когда PassportStrategy установит реальное имя стратегии, сохраним callback по этому имени
        Object.defineProperty(this, 'name', {
            get() {
                return strategyName;
            },
            set(value: string) {
                strategyName = value;
                // Когда PassportStrategy устанавливает имя стратегии, сохраняем callback по этому имени
                if (value && value !== 'custom') {
                    CustomPassportStrategy.verifyCallbacksByName.set(
                        value,
                        callback,
                    );
                    console.log(
                        '[CustomPassportStrategy] Saved callback by strategy name:',
                        value,
                    );
                }
            },
            configurable: true,
            enumerable: true,
        });

        // КРИТИЧНО: Также сохраняем по прототипу, так как Object.create(prototype) может использовать другой конструктор
        // Проходим по всей цепочке прототипов и сохраняем callback в каждом
        let proto = Constructor.prototype;
        let depth = 0;
        while (proto && proto !== Object.prototype && depth < 5) {
            Object.defineProperty(proto, '_verify', {
                value: callback,
                writable: true,
                configurable: true,
                enumerable: false,
            });
            // Сохраняем также в Map по прототипу для дополнительной надежности
            CustomPassportStrategy.verifyCallbacks.set(
                proto.constructor,
                callback,
            );
            proto = Object.getPrototypeOf(proto);
            depth++;
        }

        // Также устанавливаем _verify на текущем экземпляре для совместимости
        this._verify = callback;
    }

    /**
     * Аутентификация запроса
     * Вызывается passport.authenticate при обработке запроса
     */
    authenticate(req: unknown): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const self = this as any;

        // КРИТИЧНО: Сохраняем req/res на экземпляре для использования в verified
        // Passport может не устанавливать эти свойства автоматически
        if (req && typeof req === 'object') {
            self._req = req;
            // Пробуем получить res из req (Express Request имеет свойство res)
            const reqWithRes = req as { res?: unknown };
            if (reqWithRes.res) {
                self._res = reqWithRes.res;
            }
        }

        // КРИТИЧНО: Object.create(prototype) НЕ вызывает конструктор
        // Поэтому _verify может быть не установлен на прототипе для нового экземпляра
        // Решение: всегда проверяем и восстанавливаем _verify из статического Map
        const Constructor = self.constructor;
        const classProto = Constructor.prototype;

        // КРИТИЧНО: Если callback не был передан в конструкторе (при создании через DI),
        // создаем его динамически из метода validate
        if (!CustomPassportStrategy.verifyCallbacks.has(Constructor)) {
            // Пробуем получить метод validate из прототипа или текущего экземпляра
            const protoValidate = classProto?.validate;
            const instanceValidate = (
                self as { validate?: (req: unknown) => Promise<unknown> }
            ).validate;
            const validateMethod:
                | ((req: unknown) => Promise<unknown>)
                | undefined = protoValidate ?? instanceValidate;

            if (validateMethod && typeof validateMethod === 'function') {
                // Создаем callback из метода validate
                // Используем bind для правильного контекста (self или прототип)
                const callback = (
                    req: unknown,
                    done: (error: Error | null, user?: unknown) => void,
                ): void => {
                    // Вызываем validate с правильным контекстом
                    // Если метод на прототипе, используем self как контекст
                    const validateContext =
                        classProto?.validate === validateMethod
                            ? self
                            : validateMethod;
                    Promise.resolve(
                        validateMethod.call(validateContext as unknown, req),
                    )
                        .then((user) => {
                            if (!user) {
                                return done(null, false);
                            }
                            done(null, user);
                        })
                        .catch((error) => {
                            // Преобразуем NestJS исключения в стандартные Error для Passport
                            const passportError =
                                error instanceof Error
                                    ? error
                                    : new Error(String(error));

                            // Если это NestJS HttpException, преобразуем в стандартный Error
                            // с сохранением сообщения
                            if (
                                error &&
                                typeof error === 'object' &&
                                'getStatus' in error &&
                                'message' in error
                            ) {
                                const httpError = error as {
                                    getStatus: () => number;
                                    message: string | string[];
                                };
                                const message = Array.isArray(httpError.message)
                                    ? httpError.message.join(', ')
                                    : httpError.message;
                                done(new Error(message));
                            } else {
                                done(passportError);
                            }
                        });
                };

                // Сохраняем callback
                CustomPassportStrategy.verifyCallbacks.set(
                    Constructor,
                    callback,
                );
                const strategyName =
                    self.name ??
                    Constructor.name.replace('SSOStrategy', '').toLowerCase();
                CustomPassportStrategy.verifyCallbacksByName.set(
                    strategyName,
                    callback,
                );

                // Устанавливаем на прототипе
                Object.defineProperty(classProto, '_verify', {
                    value: callback,
                    writable: true,
                    configurable: true,
                    enumerable: false,
                });

                // Также устанавливаем на текущем экземпляре
                self._verify = callback;

                console.log(
                    `[CustomPassportStrategy.authenticate] Created callback dynamically from validate method for ${Constructor.name}`,
                );
            } else {
                console.warn(
                    `[CustomPassportStrategy.authenticate] validate method not found for ${Constructor.name}. Available methods: ${Object.getOwnPropertyNames(classProto).join(', ')}`,
                );
            }
        }

        console.log('[CustomPassportStrategy.authenticate]', {
            constructorName: Constructor.name,
            hasProto: !!classProto,
            protoVerify: typeof classProto?._verify,
            instanceVerify: typeof self._verify,
            hasCallbackInMap:
                CustomPassportStrategy.verifyCallbacks.has(Constructor),
        });

        // Проверяем _verify на экземпляре, затем на прототипе
        let verifyFn = self._verify;
        if (!verifyFn || typeof verifyFn !== 'function') {
            // Проверяем прототип созданного класса
            if (
                classProto?._verify &&
                typeof classProto._verify === 'function'
            ) {
                verifyFn = classProto._verify;
            } else {
                // Проверяем статический Map - это наш основной источник истины
                // так как конструктор может не вызываться при Object.create(prototype)
                let savedCallback =
                    CustomPassportStrategy.verifyCallbacks.get(Constructor);

                // Если не найдено по конструктору, проверяем всю цепочку прототипов
                if (!savedCallback || typeof savedCallback !== 'function') {
                    let proto = classProto;
                    while (proto && proto !== Object.prototype) {
                        savedCallback =
                            CustomPassportStrategy.verifyCallbacks.get(
                                proto.constructor,
                            );
                        if (
                            savedCallback &&
                            typeof savedCallback === 'function'
                        ) {
                            break;
                        }
                        proto = Object.getPrototypeOf(proto);
                    }
                }

                // Если все еще не найдено, проверяем по имени стратегии
                if (!savedCallback || typeof savedCallback !== 'function') {
                    // Пробуем разные варианты имени стратегии
                    const possibleNames = [
                        self.name,
                        Constructor.name
                            .replace('SSOStrategy', '')
                            .toLowerCase(),
                        'oauth2', // fallback для OAuth2SSOStrategy
                        'oidc', // fallback для OIDCSSOStrategy
                        'saml', // fallback для SAMLSSOStrategy
                        // Пробуем получить имя стратегии из Passport
                        ((): string | null => {
                            try {
                                // Passport хранит стратегии в приватном поле _strategies
                                // Используем type assertion для доступа к внутреннему API
                                const passportWithStrategies =
                                    passport as typeof passport & {
                                        _strategies?: Record<
                                            string,
                                            { constructor?: unknown }
                                        >;
                                    };
                                const strategies =
                                    passportWithStrategies._strategies ?? {};
                                for (const [name, strategy] of Object.entries(
                                    strategies,
                                )) {
                                    // Проверяем, что strategy имеет конструктор
                                    if (
                                        strategy &&
                                        typeof strategy === 'object' &&
                                        'constructor' in strategy &&
                                        strategy.constructor === Constructor
                                    ) {
                                        return name;
                                    }
                                }
                            } catch {
                                // Игнорируем ошибки
                            }
                            return null;
                        })(),
                    ].filter(Boolean) as string[];

                    const availableNames = Array.from(
                        CustomPassportStrategy.verifyCallbacksByName.keys(),
                    );
                    console.log(
                        '[CustomPassportStrategy.authenticate] Trying names:',
                        possibleNames,
                    );
                    console.log(
                        '[CustomPassportStrategy.authenticate] Available in Map:',
                        availableNames,
                    );

                    for (const name of possibleNames) {
                        savedCallback =
                            CustomPassportStrategy.verifyCallbacksByName.get(
                                name,
                            );
                        if (
                            savedCallback &&
                            typeof savedCallback === 'function'
                        ) {
                            console.log(
                                '[CustomPassportStrategy.authenticate] Found callback by name:',
                                name,
                            );
                            break;
                        }
                    }
                }

                if (savedCallback && typeof savedCallback === 'function') {
                    verifyFn = savedCallback;
                    // КРИТИЧНО: Восстанавливаем _verify на прототипе для будущих вызовов
                    // Это гарантирует, что следующий экземпляр через Object.create будет иметь _verify
                    Object.defineProperty(classProto, '_verify', {
                        value: savedCallback,
                        writable: true,
                        configurable: true,
                        enumerable: false,
                    });
                } else {
                    // Если _verify не найден, это критическая ошибка
                    const errorMsg =
                        'CustomPassportStrategy: _verify is not available on instance, prototype, or static map';
                    console.error('[CustomPassportStrategy]', errorMsg, {
                        Constructor: Constructor.name,
                        instanceVerify: typeof self._verify,
                        protoVerify: typeof classProto?._verify,
                        hasCallback:
                            CustomPassportStrategy.verifyCallbacks.has(
                                Constructor,
                            ),
                        strategyName: self.name ?? Constructor.name,
                        hasCallbackByName:
                            CustomPassportStrategy.verifyCallbacksByName.has(
                                self.name ?? Constructor.name,
                            ),
                    });
                    // Проверяем, что метод error существует
                    if (typeof self.error === 'function') {
                        return self.error(new Error(errorMsg));
                    }
                    // Если метод error не найден, пробуем через BaseStrategy.prototype
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                        const passportStrategyModule = require('passport-strategy');
                        const BaseStrategy = passportStrategyModule?.Strategy;
                        if (
                            BaseStrategy?.prototype?.error &&
                            typeof BaseStrategy.prototype.error === 'function'
                        ) {
                            return BaseStrategy.prototype.error.call(
                                self,
                                new Error(errorMsg),
                            );
                        }
                    } catch {
                        // Игнорируем ошибки require
                    }
                    // Если и это не помогло, пробуем через модульную переменную
                    if (
                        BaseStrategyProto?.error &&
                        typeof BaseStrategyProto.error === 'function'
                    ) {
                        return BaseStrategyProto.error.call(
                            self,
                            new Error(errorMsg),
                        );
                    }
                    // Если метод error не найден, логируем ошибку
                    console.error(
                        '[CustomPassportStrategy] Error method not found, cannot report error',
                    );
                    return;
                }
            }
            // Восстанавливаем _verify на экземпляре для будущих вызовов
            self._verify = verifyFn;
        }

        // Создаем функцию verified, как это делает passport-custom
        function verified(
            err: Error | null,
            user: unknown,
            info: unknown,
        ): void {
            if (err) {
                // КРИТИЧНО: Используем прямой вызов через BaseStrategy.prototype
                // При Object.create(prototype) методы могут быть недоступны через цепочку прототипов
                // Используем require напрямую внутри функции для гарантированного доступа
                try {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                    const passportStrategyModule = require('passport-strategy');
                    const BaseStrategy = passportStrategyModule?.Strategy;
                    if (
                        BaseStrategy?.prototype?.error &&
                        typeof BaseStrategy.prototype.error === 'function'
                    ) {
                        return BaseStrategy.prototype.error.call(self, err);
                    }
                } catch (requireError) {
                    // Игнорируем ошибки require, но логируем для диагностики
                    if (process.env.NODE_ENV === 'test') {
                        console.warn(
                            '[CustomPassportStrategy.verified] Failed to require passport-strategy:',
                            requireError,
                        );
                    }
                }
                // Fallback: пробуем через модульную переменную
                if (
                    BaseStrategyProto?.error &&
                    typeof BaseStrategyProto.error === 'function'
                ) {
                    return BaseStrategyProto.error.call(self, err);
                }
                // Fallback: пробуем через экземпляр
                if (self.error && typeof self.error === 'function') {
                    return self.error.call(self, err);
                }
                // Если метод error не найден, пробуем вызвать fail с сообщением об ошибке
                // Это последний fallback для обработки ошибок
                try {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                    const BaseStrategy = require('passport-strategy').Strategy;
                    if (
                        BaseStrategy?.prototype?.fail &&
                        typeof BaseStrategy.prototype.fail === 'function'
                    ) {
                        const errorMessage =
                            err instanceof Error ? err.message : String(err);
                        const failMethod = BaseStrategy.prototype.fail as (
                            challenge?: unknown,
                        ) => void;
                        failMethod.call(self, errorMessage);
                        return;
                    }
                } catch {
                    // Игнорируем ошибки require
                }
                // Если и fail не найден, пробуем пробросить ошибку через Passport механизм напрямую
                // Используем сохраненные req/res из authenticate
                try {
                    const req = self._req;
                    const res = self._res;

                    if (req && res) {
                        // Если есть req/res, пробрасываем ошибку через них
                        const errorMessage =
                            err instanceof Error ? err.message : String(err);
                        // Устанавливаем статус 401 по умолчанию
                        res.status(401).json({
                            statusCode: 401,
                            message: errorMessage,
                            error: 'Unauthorized',
                        });
                        return;
                    }
                } catch {
                    // Игнорируем ошибки при попытке использовать req/res
                }

                // Если ничего не помогло, создаем собственную реализацию error метода
                // Это последний fallback - просто пробрасываем ошибку как есть
                // Passport Guard должен обработать её
                const errorMessage =
                    err instanceof Error ? err.message : String(err);
                console.error(
                    `[CustomPassportStrategy.verified] Error and fail methods not found. Error message: ${errorMessage}`,
                );
                // Пробрасываем ошибку через throw, чтобы Guard мог её обработать
                // Но это может не сработать, так как мы в callback
                // Поэтому просто возвращаемся - Guard должен обработать отсутствие user
                return;
            }
            if (!user) {
                // КРИТИЧНО: Используем прямой вызов через BaseStrategy.prototype
                try {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                    const BaseStrategy = require('passport-strategy').Strategy;
                    if (
                        BaseStrategy?.prototype?.fail &&
                        typeof BaseStrategy.prototype.fail === 'function'
                    ) {
                        // Вызываем fail метод напрямую - тип проверен через typeof
                        BaseStrategy.prototype.fail.call(self, info);
                        return;
                    }
                } catch {
                    // Игнорируем ошибки require
                }
                // Fallback: пробуем через модульную переменную
                if (
                    BaseStrategyProto?.fail &&
                    typeof BaseStrategyProto.fail === 'function'
                ) {
                    // Вызываем fail метод напрямую - тип проверен через typeof
                    const failMethod = BaseStrategyProto.fail as (
                        challenge?: unknown,
                    ) => void;
                    failMethod.call(self, info);
                    return;
                }
                // Fallback: пробуем через экземпляр
                if (self.fail && typeof self.fail === 'function') {
                    return self.fail.call(self, info);
                }
                // Если метод fail не найден, логируем
                console.warn(
                    '[CustomPassportStrategy.verified] Fail method not found, user is null',
                );
                return;
            }
            // КРИТИЧНО: Используем прямой вызов через BaseStrategy.prototype
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                const BaseStrategy = require('passport-strategy').Strategy;
                if (
                    BaseStrategy?.prototype?.success &&
                    typeof BaseStrategy.prototype.success === 'function'
                ) {
                    BaseStrategy.prototype.success.call(self, user, info);
                    return;
                }
            } catch {
                // Игнорируем ошибки require
            }
            // Fallback: пробуем через модульную переменную
            if (
                BaseStrategyProto?.success &&
                typeof BaseStrategyProto.success === 'function'
            ) {
                BaseStrategyProto.success.call(self, user, info);
            } else if (self.success && typeof self.success === 'function') {
                // Fallback: пробуем через экземпляр
                self.success.call(self, user, info);
            } else {
                console.warn(
                    '[CustomPassportStrategy.verified] Success method not found',
                );
            }
        }

        // Вызываем verify
        try {
            verifyFn(req, verified);
        } catch (ex) {
            // КРИТИЧНО: Используем прямой вызов через BaseStrategy.prototype
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                const BaseStrategy = require('passport-strategy').Strategy;
                if (
                    BaseStrategy?.prototype?.error &&
                    typeof BaseStrategy.prototype.error === 'function'
                ) {
                    return BaseStrategy.prototype.error.call(self, ex as Error);
                }
            } catch {
                // Игнорируем ошибки require
            }
            // Fallback: пробуем через модульную переменную
            if (
                BaseStrategyProto?.error &&
                typeof BaseStrategyProto.error === 'function'
            ) {
                return BaseStrategyProto.error.call(self, ex as Error);
            }
            // Fallback: пробуем через экземпляр
            if (self.error && typeof self.error === 'function') {
                return self.error.call(self, ex as Error);
            }
            // Если метод error не найден, логируем ошибку
            console.error(
                '[CustomPassportStrategy.authenticate] Error method not found:',
                ex,
            );
        }
    }
}
