import { Strategy as CustomStrategy } from 'passport-custom';

/**
 * Обертка для passport-custom Strategy, совместимая с PassportStrategy
 *
 * PassportStrategy передает callback последним аргументом в super(),
 * но passport-custom требует verify как первый (и единственный) аргумент.
 * Эта обертка решает эту проблему, извлекая callback из аргументов
 * и устанавливая его как _verify.
 *
 * PassportStrategy вызывает: super(...args, callback)
 * Где args - это аргументы конструктора (в нашем случае пусто),
 * а callback - это функция, созданная из validate метода.
 *
 * В нашей обертке args будет содержать все аргументы, включая callback.
 */
export class PassportCustomStrategyWrapper extends CustomStrategy {
    constructor(...args: unknown[]) {
        // PassportStrategy вызывает: super(...args, callback)
        // Где args - это аргументы конструктора (в нашем случае пусто, так как мы вызываем super() без аргументов),
        // а callback - это функция, созданная из validate метода.
        //
        // Когда PassportStrategy вызывает super(...args, callback):
        // - Если args = [], то super(...args, callback) становится super(callback)
        // - В нашей обертке args будет содержать только callback (так как ...args распаковывает массив)
        //
        // Поэтому callback всегда должен быть первым (и единственным) аргументом
        const callback = args[0] as (
            req: unknown,
            done: (error: Error | null, user?: unknown) => void,
        ) => void;

        if (!callback || typeof callback !== 'function') {
            const errorMsg = `PassportCustomStrategyWrapper requires a verify callback. Received ${args.length} args: ${args.map((arg) => typeof arg).join(', ')}`;
            console.error(
                '[PassportCustomStrategyWrapper]',
                errorMsg,
                'args:',
                args,
            );
            throw new TypeError(errorMsg);
        }

        // Вызываем родительский конструктор с callback как первым аргументом
        // passport-custom.Strategy требует verify как первый (и единственный) аргумент
        // Родительский конструктор устанавливает this._verify = verify
        super(callback);

        // Убеждаемся, что _verify установлен правильно после вызова super()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let verify = (this as any)._verify;
        if (!verify || typeof verify !== 'function') {
            // Если _verify не установлен родительским конструктором, устанавливаем его вручную
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this as any)._verify = callback;
            verify = callback;
            console.warn(
                '[PassportCustomStrategyWrapper] _verify was not set by parent constructor, setting it manually',
            );
        }

        // КРИТИЧНО: Защищаем _verify от перезаписи через Object.defineProperty
        // Это гарантирует, что _verify не будет потерян при регистрации стратегии в Passport
        // или при других операциях
        Object.defineProperty(this, '_verify', {
            value: verify,
            writable: true, // Разрешаем перезапись для возможного восстановления
            configurable: true, // Разрешаем конфигурацию
            enumerable: false, // Скрываем от перечисления
        });

        // Сохраняем ссылку на callback для возможного восстановления _verify
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)._savedCallback = callback;

        // КРИТИЧНО: Проблема в том, что passport.authenticate создает новый экземпляр через Object.create(prototype)
        // Это означает, что свойства экземпляра (включая _verify) не копируются
        // Решение: устанавливаем _verify на прототипе, чтобы он был доступен во всех экземплярах

        // Устанавливаем _verify на прототипе, чтобы он был доступен при Object.create
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (PassportCustomStrategyWrapper.prototype as any)._verify = callback;

        // Также устанавливаем _verify на текущем экземпляре для совместимости
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)._verify = callback;

        // Переопределяем authenticate на прототипе, чтобы он был доступен во всех экземплярах
        // Используем обычную функцию (не arrow), чтобы сохранить правильный контекст this
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (PassportCustomStrategyWrapper.prototype as any).authenticate =
            function (req: unknown) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const self = this as any;

                // КРИТИЧНО: passport-custom вызывает this._verify(req, verified) напрямую
                // Но при Object.create(prototype) свойства экземпляра не копируются
                // Поэтому проверяем _verify на экземпляре, затем на прототипе
                let verifyFn = self._verify;
                if (!verifyFn || typeof verifyFn !== 'function') {
                    // Проверяем прототип
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const proto = Object.getPrototypeOf(self);
                    if (
                        proto &&
                        proto._verify &&
                        typeof proto._verify === 'function'
                    ) {
                        verifyFn = proto._verify;
                    } else {
                        // Если _verify не найден, это критическая ошибка
                        const errorMsg =
                            'PassportCustomStrategyWrapper: _verify is not available on instance or prototype';
                        console.error(
                            '[PassportCustomStrategyWrapper]',
                            errorMsg,
                        );
                        // Проверяем, что метод error существует перед вызовом
                        if (typeof self.error === 'function') {
                            return self.error(new Error(errorMsg));
                        }
                        // Fallback: пробуем через BaseStrategy.prototype
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                            const BaseStrategy =
                                require('passport-strategy').Strategy;
                            if (
                                BaseStrategy?.prototype?.error &&
                                typeof BaseStrategy.prototype.error ===
                                    'function'
                            ) {
                                return BaseStrategy.prototype.error.call(
                                    self,
                                    new Error(errorMsg),
                                );
                            }
                        } catch {
                            // Игнорируем ошибки require
                        }
                        // Если ничего не помогло, просто возвращаемся
                        // Passport Guard должен обработать отсутствие user
                        return;
                    }
                    // Восстанавливаем _verify на экземпляре для будущих вызовов
                    self._verify = verifyFn;
                }

                // Создаем функцию verified, как это делает оригинальный passport-custom
                function verified(
                    err: Error | null,
                    user: unknown,
                    info: unknown,
                ) {
                    // КРИТИЧНО: Проверяем, что self существует
                    if (!self) {
                        console.error(
                            '[PassportCustomStrategyWrapper.verified] self is undefined',
                        );
                        return;
                    }

                    if (err) {
                        // Проверяем, что метод error существует перед вызовом
                        if (self.error && typeof self.error === 'function') {
                            return self.error(err);
                        }
                        // Fallback через BaseStrategy.prototype
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                            const BaseStrategy =
                                require('passport-strategy').Strategy;
                            if (
                                BaseStrategy?.prototype?.error &&
                                typeof BaseStrategy.prototype.error ===
                                    'function'
                            ) {
                                return BaseStrategy.prototype.error.call(
                                    self,
                                    err,
                                );
                            }
                        } catch {
                            // Игнорируем ошибки require
                        }
                        return;
                    }
                    if (!user) {
                        // Проверяем, что метод fail существует перед вызовом
                        if (self.fail && typeof self.fail === 'function') {
                            return self.fail(info);
                        }
                        // Fallback через BaseStrategy.prototype
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                            const BaseStrategy =
                                require('passport-strategy').Strategy;
                            if (
                                BaseStrategy?.prototype?.fail &&
                                typeof BaseStrategy.prototype.fail ===
                                    'function'
                            ) {
                                return BaseStrategy.prototype.fail.call(
                                    self,
                                    info,
                                );
                            }
                        } catch {
                            // Игнорируем ошибки require
                        }
                        return;
                    }
                    // Проверяем, что метод success существует перед вызовом
                    if (self.success && typeof self.success === 'function') {
                        self.success(user, info);
                    } else {
                        // Fallback через BaseStrategy.prototype
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                            const BaseStrategy =
                                require('passport-strategy').Strategy;
                            if (
                                BaseStrategy?.prototype?.success &&
                                typeof BaseStrategy.prototype.success ===
                                    'function'
                            ) {
                                BaseStrategy.prototype.success.call(
                                    self,
                                    user,
                                    info,
                                );
                            }
                        } catch {
                            // Игнорируем ошибки require
                        }
                    }
                }

                // Вызываем verify
                try {
                    verifyFn(req, verified);
                } catch (ex) {
                    if (typeof self.error === 'function') {
                        return self.error(ex);
                    }
                    // Fallback через BaseStrategy.prototype
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                        const BaseStrategy =
                            require('passport-strategy').Strategy;
                        if (
                            BaseStrategy?.prototype?.error &&
                            typeof BaseStrategy.prototype.error === 'function'
                        ) {
                            return BaseStrategy.prototype.error.call(self, ex);
                        }
                    } catch {
                        // Игнорируем ошибки require
                    }
                    return;
                }
            };
    }
}
