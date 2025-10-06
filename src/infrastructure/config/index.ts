import { validateEnv, ValidatedEnv } from './env/validation';

let cachedEnv: ValidatedEnv | null = null;

export function getConfig(): ValidatedEnv {
    if (!cachedEnv) {
        cachedEnv = validateEnv(process.env);
    }
    return cachedEnv;
}


