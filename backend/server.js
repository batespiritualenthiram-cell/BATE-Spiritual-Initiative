/* ============================================
   BHARATHIYA ART TECH EXPERTISM
   Express Backend Server — PostgreSQL Edition
   ============================================ */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const { generateReport, generateRegistrationId } = require('./pdfGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== DATABASE SETUP ====================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDb() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS purchases (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                city TEXT,
                email TEXT,
                reg_id_numeric BIGINT UNIQUE NOT NULL,
                reg_id_sanskrit TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✅ Database initialized successfully.');
    } catch (err) {
        console.error('❌ Database initialization failed:', err.message);
    }
}

// ==================== SELF-PINGER (Keep-Alive) ====================
function startSelfPinger() {
    const PING_INTERVAL_MS = 14 * 60 * 1000; // Every 14 minutes
    const selfUrl = process.env.RENDER_EXTERNAL_URL;

    if (!selfUrl) {
        console.log('ℹ️  Self-Pinger: RENDER_EXTERNAL_URL not set. Skipping (local dev mode).');
        return;
    }

    // Use built-in https/http to avoid heavy dependencies
    const { get } = selfUrl.startsWith('https') ? require('https') : require('http');

    setInterval(() => {
        const pingUrl = `${selfUrl}/api/health`;
        get(pingUrl, (res) => {
            console.log(`🏓 Self-Ping OK — Status: ${res.statusCode} at ${new Date().toLocaleTimeString('en-IN')}`);
        }).on('error', (err) => {
            console.warn(`⚠️  Self-Ping failed: ${err.message}`);
        });
    }, PING_INTERVAL_MS);

    console.log(`🏓 Self-Pinger started — pinging ${selfUrl}/api/health every 14 minutes.`);
}

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ==================== ROUTES ====================

/**
 * Health check endpoint (also used by self-pinger)
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Bharathiya Art Tech Expertism',
        timestamp: new Date().toISOString()
    });
});

/**
 * Save new purchase record
 * POST /api/save-purchase
 */
app.post('/api/save-purchase', async (req, res) => {
    try {
        const { name, phone, city, email, regId, status } = req.body;
        await pool.query(
            `INSERT INTO purchases (name, phone, city, email, reg_id_numeric, reg_id_sanskrit, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (reg_id_numeric) DO UPDATE SET status = EXCLUDED.status`,
            [name, phone, city, email, regId?.numeric, regId?.sanskrit, status || 'pending']
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Verify payment via ID lookup
 * POST /api/verify-payment
 */
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { numericId } = req.body;
        if (!numericId) {
            return res.status(400).json({ success: false, error: 'ID required' });
        }

        const result = await pool.query(
            `SELECT * FROM purchases WHERE reg_id_numeric = $1`,
            [parseInt(numericId)]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Registration ID not found.' });
        }

        // Mark as verified
        await pool.query(
            `UPDATE purchases SET status = 'verified' WHERE reg_id_numeric = $1`,
            [parseInt(numericId)]
        );

        res.json({ success: true, message: 'Payment verified successfully.' });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

/**
 * Check download status — used by download.html for final gate-keeping
 * GET /api/check-status/:id
 */
app.get('/api/check-status/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT status FROM purchases WHERE reg_id_numeric = $1`,
            [parseInt(req.params.id)]
        );

        if (result.rows.length === 0) {
            return res.json({ verified: false, reason: 'ID not found.' });
        }

        const isVerified = result.rows[0].status === 'verified';
        res.json({ verified: isVerified, reason: isVerified ? 'OK' : 'Payment not yet verified.' });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ verified: false, reason: 'Server error' });
    }
});

/**
 * Admin view purchases
 * POST /api/admin/purchases
 */
app.post('/api/admin/purchases', async (req, res) => {
    const { password } = req.body;
    if (password !== 'Sanjay_11') {
        return res.status(401).json({ success: false, error: 'Unauthorized: Incorrect Password' });
    }
    try {
        const result = await pool.query(`SELECT * FROM purchases ORDER BY created_at DESC`);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Admin delete single purchase
 * POST /api/admin/delete
 */
app.post('/api/admin/delete', async (req, res) => {
    const { password, index } = req.body;
    if (password !== 'Sanjay_11') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    try {
        // Get all records sorted newest first, then delete the one at the given index
        const result = await pool.query(`SELECT id FROM purchases ORDER BY created_at DESC`);
        if (index < 0 || index >= result.rows.length) {
            return res.status(400).json({ success: false, error: 'Invalid index' });
        }
        const targetId = result.rows[index].id;
        await pool.query(`DELETE FROM purchases WHERE id = $1`, [targetId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Admin clear all purchases
 * POST /api/admin/clear
 */
app.post('/api/admin/clear', async (req, res) => {
    const { password } = req.body;
    if (password !== 'Sanjay_11') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    try {
        await pool.query(`DELETE FROM purchases`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Generate astrology report PDF
 * POST /api/generate-report
 */
app.post('/api/generate-report', async (req, res) => {
    try {
        const { name, dob, tob, pob, email } = req.body;

        if (!name || !dob || !tob || !pob) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'dob', 'tob', 'pob']
            });
        }

        const regId = generateRegistrationId();
        const dobFormatted = new Date(dob).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        const pdfBuffer = await generateReport({ name, dob: dobFormatted, tob, pob, email: email || '', regId });

        const filename = `BATE_Astrology_${regId.numeric}.pdf`;
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': pdfBuffer.length,
            'X-Registration-Id': regId.sanskrit,
            'X-Registration-Id-Numeric': regId.numeric.toString()
        });

        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report', message: error.message });
    }
});

/**
 * Get registration ID only (without PDF)
 */
app.get('/api/generate-id', (req, res) => {
    const regId = generateRegistrationId();
    res.json({ numeric: regId.numeric, sanskrit: regId.sanskrit });
});

// Catch-all: serve index.html
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
    } else {
        next();
    }
});

// ==================== START SERVER ====================
async function startServer() {
    await initDb();
    app.listen(PORT, () => {
        console.log(`
╔══════════════════════════════════════════════════╗
║   Bharathiya Art Tech Expertism                  ║
║   Server running on http://localhost:${PORT}         ║
║   Press Ctrl+C to stop                           ║
╚══════════════════════════════════════════════════╝
        `);
        startSelfPinger();
    });
}

startServer();

module.exports = app;
