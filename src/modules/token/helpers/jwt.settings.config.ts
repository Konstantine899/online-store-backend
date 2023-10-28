interface IExpiresIn {
    expiresIn: string;
}

interface IJwtSettingsConfig {
    jwtSecretKey: string;
    expiresIn: IExpiresIn;
}

export default (): IJwtSettingsConfig => ({
    jwtSecretKey: process.env.JWT_PRIVATE_KEY,
    expiresIn: { expiresIn: '24h' },
});
