// no Request import needed
import { getConfig } from '@app/infrastructure/config';

export type RefreshCookieName = 'refreshToken';

export function getRefreshCookieName(): RefreshCookieName {
    return 'refreshToken';
}

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
        ...(typeof maxAge === 'number' ? { maxAge } : {}),
    } as const;
}

// Ленивая инициализация, чтобы не трогать env на импорт
let CACHED_BASE_COOKIE_OPTIONS:
    | Readonly<{
          httpOnly: true;
          secure: boolean;
          sameSite: 'lax' | 'none';
          path: string;
          domain: string | undefined;
          signed: true;
      }>
    | undefined;

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
    if (CACHED_REFRESH_MAX_AGE === undefined) {
        // первый вызов: вычисляем
        const cfg = getConfig();
        const value = cfg.JWT_REFRESH_TTL;
        const match = /^([0-9]+)\s*([smhd])$/.exec(value);
        if (!match) {
            CACHED_REFRESH_MAX_AGE = null;
        } else {
            const amount = Number(match[1]);
            const unit = match[2];
            const seconds =
                unit === 's'
                    ? amount
                    : unit === 'm'
                    ? amount * 60
                    : unit === 'h'
                    ? amount * 3600
                    : amount * 86400;
            CACHED_REFRESH_MAX_AGE = seconds * 1000;
        }
    }
    return CACHED_REFRESH_MAX_AGE === null
        ? undefined
        : (CACHED_REFRESH_MAX_AGE as number | undefined);
}
