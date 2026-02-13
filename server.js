const express = require('express');
const path = require('path');
const session = require('express-session');
const clientPromise = require('./db');
const config = require('./config');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

// Disable caching
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// Auth Middleware
const isAdmin = (req, res, next) => {
    if (req.session.admin) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// SSE Clients
let sseClients = [];

const broadcastActivity = (data) => {
    const payload = JSON.stringify(data);
    sseClients.forEach(client => {
        try {
            client.res.write(`data: ${payload}\n\n`);
        } catch (e) {
            console.error('Error broadcasting to client:', e);
        }
    });
};

// Clean up dead connections every 30 seconds
setInterval(() => {
    sseClients = sseClients.filter(client => {
        try {
            return !client.res.destroyed;
        } catch {
            return false;
        }
    });
}, 30000);

app.get('/api/activity-stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    sseClients.push(newClient);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to activity stream' })}\n\n`);

    req.on('close', () => {
        sseClients = sseClients.filter(c => c.id !== clientId);
    });
});

// API Endpoints
app.get('/api/content', async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db('baeci');
        const content = await db.collection('content').findOne({ id: 'main' });
        
        // Return default structure if no content exists
        if (!content) {
            return res.json({
                texts: {
                    title: 'BAECI STORE',
                    username: '@BAECIOFFICIAL',
                    bio: 'Rekber, Japost, Topup',
                    header_title: 'BAECI STORE',
                    footer_note: 'Professional Digital Service since 2024',
                    stat_sales: '12K+',
                    stat_rating: '4.9'
                },
                links: [],
                sidebar: [],
                socials: [],
                customPages: [],
                images: {
                    desktop: 'https://c.top4top.io/p_3695apyqi1.jpg',
                    mobile: 'https://d.top4top.io/p_3695nb30a2.jpg',
                    profile: 'https://f.top4top.io/p_3695yhpth1.png'
                },
                config: {
                    siteTitle: 'BAECI STORE | Professional Biolink',
                    metaDesc: 'BAECI STORE Official - Penyedia layanan Rekber, Japost, dan Topup Game termurah & terpercaya',
                    metaKeys: 'BAECI STORE, Rekber, Japost, Topup Game'
                }
            });
        }
        
        res.json(content);
    } catch (e) {
        console.error('Error fetching content:', e);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

app.post('/api/login', (req, res) => {
    const { password } = req.body;
    
    if (!password) {
        return res.status(400).json({ error: 'Password required' });
    }
    
    if (password === config.ADMIN_PASSWORD) {
        req.session.admin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Wrong password' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.post('/api/content', isAdmin, async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db('baeci');
        
        // Validate the content structure
        const content = req.body;
        
        await db.collection('content').updateOne(
            { id: 'main' },
            { 
                $set: {
                    ...content,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
        
        // Broadcast the update
        broadcastActivity({
            method: 'POST',
            path: '/api/content',
            details: 'Content updated successfully',
            timestamp: new Date().toISOString()
        });
        
        res.json({ success: true });
    } catch (e) {
        console.error('Error saving content:', e);
        res.status(500).json({ error: e.message });
    }
});

// Broadcast middleware for API requests
app.use('/api/', (req, res, next) => {
    if (req.path !== '/activity-stream' && req.path !== '/login' && req.method !== 'GET') {
        broadcastActivity({
            method: req.method,
            path: req.path,
            details: 'API Request Processed',
            timestamp: new Date().toISOString()
        });
    }
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    etag: true,
    lastModified: true
}));

// HTML routes
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dbadmin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dbadmin.html'));
});

// Dynamic routes for custom pages
app.get('/:route', async (req, res, next) => {
    const route = req.params.route;
    
    // Skip if it's a static file or API route
    if (route.includes('.') || 
        route === 'api' || 
        route === 'dashboard' || 
        route === 'dbadmin' ||
        route === 'style.css' ||
        route === 'script.js' ||
        route === 'favicon.ico') {
        return next();
    }
    
    try {
        const client = await clientPromise;
        const db = client.db('baeci');
        const content = await db.collection('content').findOne({ id: 'main' });
        
        if (content && content.customPages) {
            const page = content.customPages.find(p => p.slug === route && p.status === 'active');
            if (page) {
                if (page.type === 'URL') {
                    return res.redirect(page.url);
                } else if (page.type === 'HTML' && page.htmlCode) {
                    return res.send(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>${page.title || 'BAECI STORE'}</title>
                            <script src="https://cdn.tailwindcss.com"></script>
                            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                            <link rel="stylesheet" href="/style.css">
                        </head>
                        <body class="bg-black text-white min-h-screen">
                            <div class="max-w-4xl mx-auto p-4">
                                <a href="/" class="inline-block mb-4 text-blue-400 hover:underline">
                                    <i class="fa-solid fa-arrow-left mr-2"></i> Back to Home
                                </a>
                                ${page.htmlCode}
                            </div>
                        </body>
                        </html>
                    `);
                }
            }
        }
    } catch (e) {
        console.error('Route error:', e);
    }
    next();
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all route - serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export for Vercel
module.exports = app;
