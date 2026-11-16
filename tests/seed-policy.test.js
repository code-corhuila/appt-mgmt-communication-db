const { main } = require('../scripts/seed-development');

describe('development seed policy', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalMongoUri = process.env.MONGODB_URI;

    afterEach(() => {
        if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = originalNodeEnv;
        if (originalMongoUri === undefined) delete process.env.MONGODB_URI;
        else process.env.MONGODB_URI = originalMongoUri;
    });

    it('refuses to seed outside development before attempting a database connection', async () => {
        process.env.NODE_ENV = 'production';
        process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/SaludActiva_communication';

        await expect(main()).rejects.toThrow('Development seeds are only allowed');
    });

    it('requires an explicit MongoDB URI in development', async () => {
        process.env.NODE_ENV = 'development';
        delete process.env.MONGODB_URI;

        await expect(main()).rejects.toThrow('MONGODB_URI is required');
    });
});
