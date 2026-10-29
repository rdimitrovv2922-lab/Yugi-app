const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { handleAuthRoute } = require('./routes/authRoutes');
const { handleDeckRoute } = require('./routes/deckRoutes');
const { handleRoomRoute } = require('./routes/roomRoutes');
const { handleCardRoute } = require('./routes/cardRoutes');

const clientRoot = path.join(__dirname, '..', 'client');
const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const apiRoutes = [
    handleAuthRoute,
    handleDeckRoute,
    handleRoomRoute,
    handleCardRoute
];

const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');

    for (const handleRoute of apiRoutes) {
        if (await handleRoute(request, response, url)) {
            return;
        }
    }

    const requestedPath = url.pathname;
    const filePath = path.resolve(
        clientRoot,
        `.${requestedPath === '/' ? '/index.html' : requestedPath}`
    );

    if (!filePath.startsWith(clientRoot + path.sep)) {
        response.writeHead(403, { 'Content-Type': 'text/plain' });
        response.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            response.writeHead(404, { 'Content-Type': 'text/plain' });
            response.end('File not found');
            return;
        }

        const extension = path.extname(filePath);
        const contentType = contentTypes[extension] || 'application/octet-stream';

        response.writeHead(200, { 'Content-Type': contentType });
        response.end(content);
    });
});

const port = 3000;
const HOST = '0.0.0.0';

server.listen(port, HOST, () => {
    console.log(`Server listening at http://localhost:${port}`);
});