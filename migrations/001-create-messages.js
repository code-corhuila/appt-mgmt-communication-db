const MESSAGE_VALIDATOR = {
    $jsonSchema: {
        bsonType: 'object',
        required: ['senderId', 'recipientId', 'content', 'createdAt', 'readAt'],
        properties: {
            _id: { bsonType: 'objectId' },
            senderId: { bsonType: 'string', minLength: 1, maxLength: 128 },
            recipientId: { bsonType: 'string', minLength: 1, maxLength: 128 },
            content: { bsonType: 'string', minLength: 1, maxLength: 2000 },
            createdAt: { bsonType: 'date' },
            readAt: { bsonType: ['date', 'null'] },
            __v: { bsonType: 'int', minimum: 0 }
        },
        additionalProperties: false
    }
};

const MESSAGE_INDEXES = [
    { key: { senderId: 1 }, name: 'senderId_1' },
    { key: { recipientId: 1 }, name: 'recipientId_1' },
    {
        key: { senderId: 1, recipientId: 1, createdAt: -1 },
        name: 'senderId_1_recipientId_1_createdAt_-1'
    },
    {
        key: { recipientId: 1, senderId: 1, createdAt: -1 },
        name: 'recipientId_1_senderId_1_createdAt_-1'
    }
];

async function up(db) {
    const messagesExist = await db
        .listCollections({ name: 'messages' }, { nameOnly: true })
        .hasNext();

    if (messagesExist) {
        await db.command({
            collMod: 'messages',
            validator: MESSAGE_VALIDATOR,
            validationLevel: 'strict',
            validationAction: 'error'
        });
    } else {
        await db.createCollection('messages', {
            validator: MESSAGE_VALIDATOR,
            validationLevel: 'strict',
            validationAction: 'error'
        });
    }

    await db.collection('messages').createIndexes(MESSAGE_INDEXES);
}

module.exports = {
    name: '001-create-messages',
    up,
    MESSAGE_VALIDATOR,
    MESSAGE_INDEXES
};
