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
            console.error('[PassportCustomStrategyWrapper]', errorMsg, 'args:', args);
            throw new TypeError(errorMsg);
        }

        // Вызываем родительский конструктор с callback как первым аргументом
        // passport-custom.Strategy требует verify как первый (и единственный) аргумент
        super(callback);

        // Убеждаемся, что _verify установлен правильно после вызова super()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let verify = (this as any)._verify;
        if (!verify || typeof verify !== 'function') {
            // Если _verify не установлен родительским конструктором, устанавливаем его вручную
            // Это может произойти в некоторых случаях, когда родительский конструктор не устанавливает _verify правильно
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this as any)._verify = callback;
            verify = callback;
            console.warn(
                '[PassportCustomStrategyWrapper] _verify was not set by parent constructor, setting it manually',
            );
        }

        // Дополнительная проверка: убеждаемся, что _verify установлен и является функцией
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalVerify = (this as any)._verify;
        if (!finalVerify || typeof finalVerify !== 'function') {
            const errorMsg = `Failed to set _verify in PassportCustomStrategyWrapper. _verify type: ${typeof finalVerify}, value: ${finalVerify}`;
            console.error('[PassportCustomStrategyWrapper]', errorMsg);
            throw new Error(errorMsg);
        }

        // Сохраняем ссылку на callback для возможного восстановления _verify
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)._savedCallback = callback;

        // Переопределяем метод authenticate, чтобы убедиться, что _verify всегда доступен
        // Сохраняем ссылку на this и callback для использования в замыкании
        const self = this;
        const savedCallback = callback;
        const originalAuthenticate = this.authenticate;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).authenticate = function (req: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!(this as any)._verify || typeof (this as any)._verify !== 'function') {
                // Если _verify потерян, восстанавливаем его из сохраненного callback
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (this as any)._verify = savedCallback;
                console.warn(
                    '[PassportCustomStrategyWrapper] _verify was lost, restored from savedCallback',
                );
            }
            // Вызываем оригинальный метод authenticate с правильным контекстом
            return originalAuthenticate.call(this, req);
        };
    }
}

