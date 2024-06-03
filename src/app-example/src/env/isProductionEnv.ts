export function isProductionEnv(env: string = process.env.NODE_ENV ?? 'local') {
    return env === 'production';
}