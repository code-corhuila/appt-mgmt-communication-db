require('dotenv').config();
const { MongoClient } = require('mongodb');
const { runMigrations } = require('./migration-runner');

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is required');

    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    try {
        await client.connect();
        const applied = await runMigrations(client.db());
        if (applied.length === 0) {
            console.log('Database schema is up to date');
        } else {
            console.log(`Applied migrations: ${applied.join(', ')}`);
        }
    } finally {
        await client.close();
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Database migration failed:', error.message);
        process.exitCode = 1;
    });
}

module.exports = { main };
