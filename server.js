const express = require('express');
const path = require('path');
const session = require('express-session');
const clientPromise = require('./db');
const config = require('./config');
const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'baeci-secret',
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Middleware to disable caching
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// Auth Middleware
const isAdmin = (req, res, next) => {
    if (req.session.admin) next();
    else res.status(401).json({ error: 'Unauthorized' });
};

// SSE Clients
let sseClients = [];

const broadcastActivity = (data) => {
    const payload = JSON.stringify(data);
    sseClients.forEach(client => {
        client.res.write(`data: ${payload}\n\n`);
    });
};

app.get('/api/activity-stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    sseClients.push({ id: clientId, res });

    req.on('close', () => {
        sseClients = sseClients.filter(c => c.id !== clientId);
    });
});

// Wrapper for broadcasting
app.use((req, res, next) => {
    if (req.path.startsWith('/api/') && req.path !== '/api/activity-stream') {
        broadcastActivity({
            method: req.method,
            path: req.path,
            details: 'API Request Processed'
        });
    }
    next();
});

// API Endpoints
app.get('/api/content', async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db('baeci');
        const content = await db.collection('content').findOne({ id: 'main' });
        res.json(content || {});
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/login', (req, res) => {
    if (req.body.password === config.ADMIN_PASSWORD) {
        req.session.admin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Wrong password' });
    }
});

app.post('/api/content', isAdmin, async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db('baeci');
        await db.collection('content').updateOne(
            { id: 'main' },
            { $set: req.body },
            { upsert: true }
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Specific routes without .html extension
app.get('/dbadmin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dbadmin.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Dynamic routes for custom HTML
app.get('/:route', async (req, res, next) => {
    const route = req.params.route;
    if (['dbadmin', 'dashboard', 'api', 'style.css', 'script.js', 'favicon.ico'].includes(route) || route.includes('.')) return next();
    
    try {
        const client = await clientPromise;
        const db = client.db('baeci');
        const content = await db.collection('content').findOne({ id: 'main' });
        
        if (content && content.customPages) {
            const page = content.customPages.find(p => p.slug === route && p.status === 'active');
            if (page) {
                if (page.type === 'URL') {
                    return res.redirect(page.url);
                } else {
                    return res.send(page.htmlCode);
                }
            }
        }
    } catch (e) {
        console.error('Route error:', e);
    }
    next();
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});