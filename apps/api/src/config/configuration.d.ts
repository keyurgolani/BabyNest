declare const _default: () => {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    database: {
        url: string | undefined;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    ollama: {
        baseUrl: string;
        model: string;
    };
    cors: {
        origins: string;
    };
    throttle: {
        ttl: number;
        limit: number;
    };
};
export default _default;
//# sourceMappingURL=configuration.d.ts.map