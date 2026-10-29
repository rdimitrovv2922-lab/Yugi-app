const { randomUUID } = require('node:crypto');
const { findPublicUserById } = require('./userStore');

const authSessions = new Map();

function getAuthSessionId(request) {
    const cookies = request.headers.cookie || '';
    const authCookie = cookies
        .split(';')
        .map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith('yugiAuth='));

    return authCookie
        ? authCookie.slice('yugiAuth='.length)
        : null;
}

function getSignedInUser(request) {
    const sessionId = getAuthSessionId(request);
    const userId = sessionId ? authSessions.get(sessionId) : null;

    return userId ? findPublicUserById(userId) : null;
}

function createAuthSession(userId) {
    const sessionId = randomUUID();
    authSessions.set(sessionId, userId);
    return sessionId;
}

function deleteAuthSession(request) {
    const sessionId = getAuthSessionId(request);

    if (sessionId) {
        authSessions.delete(sessionId);
    }
}

module.exports = {
    createAuthSession,
    deleteAuthSession,
    getSignedInUser
};
