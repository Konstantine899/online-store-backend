import type { ValidatedEnv } from './env/validation';
import { validateEnv } from './env/validation';

let cachedEnv: ValidatedEnv | null = null;

export function getConfig(): ValidatedEnv {
    cachedEnv ??= validateEnv(process.env);
    return cachedEnv;
}
