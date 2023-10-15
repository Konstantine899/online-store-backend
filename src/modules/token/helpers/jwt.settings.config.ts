export default () => ({
    jwtSecretKey: process.env.JWT_PRIVATE_KEY,
    expiresIn: { expiresIn: '24h' },
});
