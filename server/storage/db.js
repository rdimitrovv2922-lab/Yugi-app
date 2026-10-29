const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const databasePath = path.join(__dirname, '..', 'data', 'local.sqlite');
const db = new DatabaseSync(databasePath);

db.exec('PRAGMA foreign_keys = ON');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS decks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deck_cards (
        deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
        card_id INTEGER NOT NULL,
        section TEXT NOT NULL CHECK (section IN ('main', 'extra', 'side')),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        PRIMARY KEY (deck_id, card_id)
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY
    )
`);

const hasDeckSectionMigration = db.prepare(
    'SELECT version FROM schema_migrations WHERE version = ?'
).get(1);

if (!hasDeckSectionMigration) {
    db.exec('BEGIN');

    try {
        db.exec(`
            CREATE TABLE deck_cards_v2 (
                deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
                card_id INTEGER NOT NULL,
                section TEXT NOT NULL CHECK (section IN ('main', 'extra', 'side')),
                quantity INTEGER NOT NULL CHECK (quantity > 0),
                PRIMARY KEY (deck_id, card_id, section)
            );

            INSERT INTO deck_cards_v2 (deck_id, card_id, section, quantity)
            SELECT deck_id, card_id, section, quantity
            FROM deck_cards;

            DROP TABLE deck_cards;

            ALTER TABLE deck_cards_v2 RENAME TO deck_cards;
        `);

        db.prepare(
            'INSERT INTO schema_migrations (version) VALUES (?)'
        ).run(1);

        db.exec('COMMIT');
    } catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}

const hasRoomMigration = db.prepare(
    'SELECT version FROM schema_migrations WHERE version = ?'
).get(2);

if (!hasRoomMigration) {
    db.exec('BEGIN');

    try {
        db.exec(`
            CREATE TABLE rooms (
                id TEXT PRIMARY KEY,
                code TEXT NOT NULL COLLATE NOCASE UNIQUE,
                created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status TEXT NOT NULL DEFAULT 'waiting'
                    CHECK (status IN ('waiting', 'active', 'finished')),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE room_players (
                room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE RESTRICT,
                seat INTEGER NOT NULL CHECK (seat IN (1, 2)),
                joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (room_id, user_id),
                UNIQUE (room_id, seat)
            );
        `);

        db.prepare(
            'INSERT INTO schema_migrations (version) VALUES (?)'
        ).run(2);

        db.exec('COMMIT');
    } catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}

const hasGameStateMigration = db.prepare(
    'SELECT version FROM schema_migrations WHERE version = ?'
).get(3);

if (!hasGameStateMigration) {
    db.exec('BEGIN');

    try {
        db.exec(`
            ALTER TABLE rooms
            ADD COLUMN game_state_json TEXT
        `);

        db.prepare(
            'INSERT INTO schema_migrations (version) VALUES (?)'
        ).run(3);

        db.exec('COMMIT');
    } catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}

module.exports = db;
