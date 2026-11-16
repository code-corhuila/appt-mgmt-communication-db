require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

async function main() {
    if (process.env.NODE_ENV !== 'development') {
        throw new Error('Development seeds are only allowed when NODE_ENV=development');
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is required');

    const seedPath = path.join(__dirname, '..', 'seeds', 'development-messages.json');
    const records = JSON.parse(fs.readFileSync(seedPath, 'utf8')).map(record => ({
        ...record,
        _id: new ObjectId(record._id),
        createdAt: new Date(record.createdAt),
        readAt: record.readAt === null ? null : new Date(record.readAt)
    }));

    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    try {
        await client.connect();
        const messages = client.db().collection('messages');
        const result = await messages.bulkWrite(records.map(record => ({
            updateOne: {
                filter: { _id: record._id },
                update: { $setOnInsert: record },
                upsert: true
            }
        })));
        console.log(`Development seed complete: ${result.upsertedCount} messages inserted`);
    } finally {
        await client.close();
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Development seed failed:', error.message);
        process.exitCode = 1;
    });
}

module.exports = { main };
