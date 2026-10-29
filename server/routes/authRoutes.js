const { registerUser, authenticateUser } = require('../auth/userStore');
const { readJsonBody } = require('../http/requestBody');
const {
    createAuthSession,
    deleteAuthSession,
    getSignedInUser
} = require('../auth/sessions');

async function handleAuthRoute(request, response, url) {
    if (request.method === 'POST' && url.pathname === '/api/register') {
        let payload;

        try {
            payload = await readJsonBody(request);
        } catch {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid JSON body' }));
            return true;
        }

        try {
            const user = await registerUser(payload);
            const sessionId = createAuthSession(user.id);


            response.writeHead(201, {
                'Content-Type': 'application/json',
                'Set-Cookie': `yugiAuth=${sessionId}; HttpOnly; SameSite=Strict; Path=/`
            });
            response.end(JSON.stringify({ user }));
        } catch (error) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: error.message }));
        }

        return true;
    }

    if (request.method === 'POST' && url.pathname === '/api/login') {
        let payload;

        try {
            payload = await readJsonBody(request);
        } catch {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid JSON body' }));
            return true;
        }

        let user;

        try {
            user = await authenticateUser(payload || {});
        } catch {
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Could not log in right now' }));
            return true;
        }

        if (!user) {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid username or password' }));
            return true;
        }

        const sessionId = createAuthSession(user.id);

        response.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `yugiAuth=${sessionId}; HttpOnly; SameSite=Strict; Path=/`
        });
        response.end(JSON.stringify({ user }));
        return true;
    }

    if (request.method === 'GET' && url.pathname === '/api/me') {
        const user = getSignedInUser(request);

        if (!user) {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Not signed in' }));
            return true;
        }

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ user }));
        return true;
    }

    if (request.method === 'POST' && url.pathname === '/api/logout') {
        deleteAuthSession(request);

        response.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': 'yugiAuth=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'
        });
        response.end(JSON.stringify({ ok: true }));
        return true;
    }
    return false;
}

module.exports = { handleAuthRoute };
