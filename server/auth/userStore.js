const { randomUUID } = require('node:crypto');
const db = require('../storage/db');
const { hashPassword, verifyPassword } = require('./passwords');

const insertUser = db.prepare(`
    INSERT INTO users (
        id,
        username,
        display_name,
        password_salt,
        password_hash
    )
    VALUES (?, ?, ?, ?, ?)
`);

const findUserByUsername = db.prepare(`
    SELECT id, username, display_name, password_salt, password_hash
    FROM users
    WHERE username = ?
`);

const findUserById = db.prepare(`
    SELECT id, username, display_name
    FROM users
    WHERE id = ?
`);

async function registerUser({ username, displayName, password }) {
    const cleanUsername =
        typeof username === 'string' ? username.trim().toLowerCase() : '';
    const cleanDisplayName =
        typeof displayName === 'string' ? displayName.trim() : '';

    if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
        throw new Error('Username must be 3–24 letters, numbers, or underscores');
    }

    if (cleanDisplayName.length < 1 || cleanDisplayName.length > 30) {
        throw new Error('Display name must be 1–30 characters');
    }

    if (typeof password !== 'string' || password.length < 8) {
        throw new Error('Password must be at least 8 characters');
    }

    const { salt, hash } = await hashPassword(password);

    const user = {
        id: randomUUID(),
        username: cleanUsername,
        displayName: cleanDisplayName
    };

    insertUser.run(
        user.id,
        user.username,
        user.displayName,
        salt,
        hash
    );

    return user;
}

async function authenticateUser({ username, password }) {
    const cleanUsername =
        typeof username === 'string' ? username.trim().toLowerCase() : '';

    if (!cleanUsername || typeof password !== 'string') {
        return null;
    }

    const row = findUserByUsername.get(cleanUsername);

    if (!row) {
        return null;
    }

    const passwordIsValid = await verifyPassword(
        password,
        row.password_salt,
        row.password_hash
    );

    if (!passwordIsValid) {
        return null;
    }

    return {
        id: row.id,
        username: row.username,
        displayName: row.display_name
    };
}

function findPublicUserById(id) {
    const row = findUserById.get(id);

    if (!row) {
        return null;
    }

    return {
        id: row.id,
        username: row.username,
        displayName: row.display_name
    };
}

module.exports = {
    registerUser,
    authenticateUser,
    findPublicUserById
};
