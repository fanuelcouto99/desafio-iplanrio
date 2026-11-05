const required = (name: string) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Variável de ambiente ${name} ausente`);
    }
    return value;
};

export const config = {
    rabbitUrl: required('RABBITMQ_URL'),
    redisUrl: required('REDIS_URL'),
    mongoUrl: required('MONGO_URL'),
    metricsPort: Number(process.env.METRICS_PORT ?? 9100),
};