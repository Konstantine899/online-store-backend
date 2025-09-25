import { Request } from 'express';

export type RefreshCookieName = 'refreshToken';

export function getRefreshCookieName(): RefreshCookieName {
    return 'refreshToken';
}

export function buildRefreshCookieOptions(req: Request) {
    const isProd = process.env.NODE_ENV === 'production';
    // Если фронт на другом домене → SameSite=None (требует Secure в проде)
    const sameSite: 'lax' | 'none' = isProd ? 'none' : 'lax';

    if (isProd) console.log('Request', req);

    return {
        httpOnly: true,
        secure: isProd, // в проде только через HTTPS
        sameSite, // cross-site в проде → 'none'
        path: '/online-store/', // сузить область действия cookie
        domain: undefined, // укажи .example.com если нужны поддомены
        signed: true, // т.к. у тебя включён cookieParser(secret)
        maxAge: 1000 * 60 * 60 * 24 * 30, // пример: 30 дней
    } as const;
}
