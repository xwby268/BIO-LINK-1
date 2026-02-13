# Baeci Store - Professional Biolink

## Overview

Baeci Store is a personal biolink/landing page application for a store that provides services like Rekber (escrow), Japost (posting services), and game top-up. The app features a visually rich frontend with iOS-style glassmorphism design, a sidebar navigation, and an admin panel for managing content dynamically. Content is stored in MongoDB and served through a Node.js/Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Single-page static frontend**: The app serves `index.html` as the main page with `style.css` for styling and `script.js` for client-side logic.
- **Styling approach**: Uses Tailwind CSS (loaded via CDN) combined with custom CSS. The design follows an iOS-inspired glassmorphism aesthetic with blur effects, translucent panels, and smooth animations.
- **Fonts & Icons**: Google Fonts (Inter, Poppins) and Font Awesome 6.4 loaded via CDN.
- **Responsive design**: Separate mobile and desktop backgrounds, sidebar behavior adapts based on screen width (1024px breakpoint). Uses `max-scale=1.0, user-scalable=no` for mobile.

### Backend
- **Framework**: Express.js (v4) running on port 5000.
- **Entry point**: `server.js` — serves static files and API endpoints.
- **Session management**: `express-session` with a hardcoded secret (`'baeci-secret'`). Sessions are stored in memory (default).
- **Authentication**: Simple password-based admin login. The admin password is stored in `config.js`. No user registration — just a single admin account. Session flag (`req.session.admin`) gates protected endpoints.
- **API structure**:
  - `GET /api/content` — Fetches the main content document from MongoDB (public).
  - `POST /api/login` — Authenticates admin with password comparison (plain text, not hashed).
  - `POST /api/content` — Updates content (admin-protected).
- **Caching**: All responses have `Cache-Control: no-store` to prevent caching.

### Data Storage
- **Database**: MongoDB Atlas (cloud-hosted). Connection is managed via the native `mongodb` driver (v7), not Mongoose.
- **Connection pattern**: `db.js` implements a singleton connection promise pattern. In development, the client promise is cached on `global` to survive hot reloads.
- **Database name**: `baeci`
- **Collection**: `content` — stores a single document with `id: 'main'` that holds all dynamic page content (texts, links, sidebar items).
- **Schema**: Schemaless/flexible. The content document contains `texts` (key-value pairs for display text), `links` (array of link objects), and `sidebar` (array of sidebar items). All managed through the admin panel.

### Configuration
- `config.js` contains MongoDB connection URI and admin password as plain exports. These are currently hardcoded rather than using environment variables.

### Key Design Decisions

1. **MongoDB native driver instead of Mongoose**: Keeps things lightweight since the data model is simple (single document store). No need for schema validation or model layer.

2. **Single-document content storage**: All page content lives in one MongoDB document (`id: 'main'`). This simplifies reads/writes but limits scalability. Appropriate for a simple biolink page.

3. **CDN-loaded frontend libraries**: Tailwind CSS, Font Awesome, and fonts are all loaded from CDNs rather than bundled. No build step required, but depends on external CDN availability.

4. **No build tooling**: The frontend has no bundler, transpiler, or build step. Raw HTML/CSS/JS served directly by Express.

5. **Static file serving**: Express serves static files from the project root directory (images expected in `public/images/`).

## External Dependencies

### NPM Packages
- **express** (v4.19) — Web server framework
- **mongodb** (v7.1) — MongoDB native driver
- **express-session** (v1.19) — Session middleware for admin auth
- **cookie-parser** (v1.4) — Cookie parsing (installed but usage not visible in provided code)
- **bcryptjs** (v3.0) — Password hashing library (installed but not currently used — passwords are compared as plain text)

### External Services
- **MongoDB Atlas** — Cloud database hosting (connection string in `config.js`)
- **CDNs**: Tailwind CSS (`cdn.tailwindcss.com`), Font Awesome (`cdnjs.cloudflare.com`), Google Fonts (`fonts.googleapis.com`)
- **External media**: Video content loaded from `l.top4top.io`, images from `vydrive.zone.id`

### Static Assets
- Background images expected at `public/images/mobile_bg.jpg` and `public/images/desktop_bg.jpg`