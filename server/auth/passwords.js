const { promisify } = require('node:util');
const {
    randomBytes,
    scrypt: scryptCallback,
    timingSafeEqual
} = require('node:crypto');

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

async function hashPassword(password) {
    const salt = randomBytes(16);
    const derivedKey = await scrypt(password, salt, KEY_LENGTH);

    return {
        salt: salt.toString('hex'),
        hash: derivedKey.toString('hex')
    };
}

async function verifyPassword(password, saltHex, hashHex) {
    const salt = Buffer.from(saltHex, 'hex');
    const expectedHash = Buffer.from(hashHex, 'hex');

    if (salt.length !== 16 || expectedHash.length !== KEY_LENGTH) {
        return false;
    }

    const actualHash = await scrypt(password, salt, KEY_LENGTH);
    return timingSafeEqual(actualHash, expectedHash);
}

module.exports = {
    hashPassword,
    verifyPassword
};