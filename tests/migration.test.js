const migration = require('../migrations/001-create-messages');
const { runMigrations } = require('../scripts/migration-runner');

describe('messages schema migration', () => {
    it('matches the communication API message shape and query indexes', () => {
        const schema = migration.MESSAGE_VALIDATOR.$jsonSchema;

        expect(schema.required).toEqual([
            'senderId',
            'recipientId',
            'content',
            'createdAt',
            'readAt'
        ]);
        expect(schema.properties.senderId).toMatchObject({
            bsonType: 'string',
            minLength: 1,
            maxLength: 128
        });
        expect(schema.properties.content).toMatchObject({
            bsonType: 'string',
            minLength: 1,
            maxLength: 2000
        });
        expect(schema.properties.readAt.bsonType).toEqual(['date', 'null']);
        expect(migration.MESSAGE_INDEXES).toEqual(expect.arrayContaining([
            expect.objectContaining({
                key: { senderId: 1, recipientId: 1, createdAt: -1 }
            }),
            expect.objectContaining({
                key: { recipientId: 1, senderId: 1, createdAt: -1 }
            })
        ]));
    });

    it('creates the collection validator and indexes on a new database', async () => {
        const collection = { createIndexes: jest.fn().mockResolvedValue([]) };
        const db = {
            listCollections: jest.fn(() => ({ hasNext: jest.fn().mockResolvedValue(false) })),
            createCollection: jest.fn().mockResolvedValue({}),
            collection: jest.fn(() => collection),
            command: jest.fn()
        };

        await migration.up(db);

        expect(db.createCollection).toHaveBeenCalledWith('messages', {
            validator: migration.MESSAGE_VALIDATOR,
            validationLevel: 'strict',
            validationAction: 'error'
        });
        expect(collection.createIndexes).toHaveBeenCalledWith(migration.MESSAGE_INDEXES);
        expect(db.command).not.toHaveBeenCalled();
    });

    it('updates validation for an existing collection without dropping data', async () => {
        const db = {
            listCollections: jest.fn(() => ({ hasNext: jest.fn().mockResolvedValue(true) })),
            createCollection: jest.fn(),
            collection: jest.fn(() => ({ createIndexes: jest.fn().mockResolvedValue([]) })),
            command: jest.fn().mockResolvedValue({})
        };

        await migration.up(db);

        expect(db.command).toHaveBeenCalledWith({
            collMod: 'messages',
            validator: migration.MESSAGE_VALIDATOR,
            validationLevel: 'strict',
            validationAction: 'error'
        });
        expect(db.createCollection).not.toHaveBeenCalled();
    });
});

describe('migration runner', () => {
    it('records applied migrations and skips already recorded versions', async () => {
        const records = new Map();
        const ledger = {
            createIndex: jest.fn().mockResolvedValue('migration_name_unique_idx'),
            findOne: jest.fn(async filter => records.get(filter.name)),
            insertOne: jest.fn(async document => {
                records.set(document.name, document);
            })
        };
        const db = { collection: jest.fn(() => ledger) };
        const up = jest.fn().mockResolvedValue();
        const migrations = [{ name: '001-test', up }];

        expect(await runMigrations(db, migrations)).toEqual(['001-test']);
        expect(await runMigrations(db, migrations)).toEqual([]);
        expect(up).toHaveBeenCalledTimes(1);
    });
});
