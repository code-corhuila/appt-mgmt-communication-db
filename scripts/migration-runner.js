const fs = require('fs');
const path = require('path');

const migrationDirectory = path.join(__dirname, '..', 'migrations');

function loadMigrations() {
    return fs.readdirSync(migrationDirectory)
        .filter(file => /^\d{3}-.*\.js$/.test(file))
        .sort()
        .map(file => require(path.join(migrationDirectory, file)));
}

async function runMigrations(db, migrations = loadMigrations()) {
    const ledger = db.collection('schema_migrations');
    await ledger.createIndex({ name: 1 }, { unique: true, name: 'migration_name_unique_idx' });

    const applied = [];
    for (const migration of migrations) {
        if (await ledger.findOne({ name: migration.name })) continue;
        await migration.up(db);
        await ledger.insertOne({ name: migration.name, appliedAt: new Date() });
        applied.push(migration.name);
    }
    return applied;
}

module.exports = { runMigrations, loadMigrations };
