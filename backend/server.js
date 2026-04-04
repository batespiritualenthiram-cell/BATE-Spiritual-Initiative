/* ============================================
   BHARATHIYA ART TECH EXPERTISM
   Express Backend Server
   ============================================ */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateReport, generateRegistrationId } = require('./pdfGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

const fs = require('fs');

// Simple persistent JSON DB
const purchasesFile = path.join(__dirname, 'purchases.json');
if (!fs.existsSync(purchasesFile)) {
    fs.writeFileSync(purchasesFile, JSON.stringify([]));
}

function getPurchases() {
    try {
        return JSON.parse(fs.readFileSync(purchasesFile, 'utf8'));
    } catch {
        return [];
    }
}

function savePurchase(record) {
    const data = getPurchases();
    data.push(record);
    fs.writeFileSync(purchasesFile, JSON.stringify(data, null, 2));
}

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ==================== ROUTES ====================

/**
 * Save new purchase record
 * POST /api/save-purchase
 */
app.post('/api/save-purchase', (req, res) => {
    try {
        const record = {
            ...req.body,
            status: req.body.status || 'verified',
            timestamp: new Date().toISOString()
        };
        savePurchase(record);
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
app.post('/api/verify-payment', (req, res) => {
    try {
        const { numericId } = req.body;
        if (!numericId) {
            return res.status(400).json({ success: false, error: 'ID required' });
        }
        
        let purchases = getPurchases();
        // Find latest matching unverified purchase
        const index = purchases.findIndex(p => p.regId && p.regId.numeric.toString() === numericId.toString());
        
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Registration ID not found.' });
        }
        
        // Mark as verified
        purchases[index].status = 'verified';
        // Save back
        fs.writeFileSync(purchasesFile, JSON.stringify(purchases, null, 2));
        
        res.json({ success: true, message: 'Payment verified successfully.' });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

/**
 * Admin view purchases
 * POST /api/admin/purchases
 */
app.post('/api/admin/purchases', (req, res) => {
    const { password } = req.body;
    if (password === 'Sanjay_11') {
        // Return sorted by newest first
        const data = getPurchases().reverse();
        res.json({ success: true, data });
    } else {
        res.status(401).json({ success: false, error: 'Unauthorized: Incorrect Password' });
    }
});

/**
 * Admin delete single purchase
 * POST /api/admin/delete
 */
app.post('/api/admin/delete', (req, res) => {
    const { password, index } = req.body;
    if (password !== 'Sanjay_11') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const data = getPurchases();
    // index is relative to reversed list (newest first), convert to actual index
    const actualIndex = data.length - 1 - index;
    if (actualIndex < 0 || actualIndex >= data.length) {
        return res.status(400).json({ success: false, error: 'Invalid index' });
    }
    data.splice(actualIndex, 1);
    fs.writeFileSync(purchasesFile, JSON.stringify(data, null, 2));
    res.json({ success: true });
});

/**
 * Admin clear all purchases
 * POST /api/admin/clear
 */
app.post('/api/admin/clear', (req, res) => {
    const { password } = req.body;
    if (password !== 'Sanjay_11') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    fs.writeFileSync(purchasesFile, JSON.stringify([]));
    res.json({ success: true });
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Bharathiya Art Tech Expertism',
        timestamp: new Date().toISOString()
    });
});

/**
 * Generate astrology report PDF
 * POST /api/generate-report
 * Body: { name, dob, tob, pob, email? }
 */
app.post('/api/generate-report', async (req, res) => {
    try {
        const { name, dob, tob, pob, email } = req.body;

        // Validate required fields
        if (!name || !dob || !tob || !pob) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'dob', 'tob', 'pob']
            });
        }

        // Generate unique registration ID
        const regId = generateRegistrationId();

        // Format date for display
        const dobFormatted = new Date(dob).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Generate PDF
        const pdfBuffer = await generateReport({
            name,
            dob: dobFormatted,
            tob,
            pob,
            email: email || '',
            regId
        });

        // Set response headers for PDF download
        const filename = `BATE_Report_${regId.numeric}.pdf`;
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
        res.status(500).json({
            error: 'Failed to generate report',
            message: error.message
        });
    }
});

/**
 * Get registration ID only (without PDF)
 * GET /api/generate-id
 */
app.get('/api/generate-id', (req, res) => {
    const regId = generateRegistrationId();
    res.json({
        numeric: regId.numeric,
        sanskrit: regId.sanskrit
    });
});

// Catch-all: serve index.html for SPA routing
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
    } else {
        next();
    }
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║   Bharathiya Art Tech Expertism                  ║
║   Server running on http://localhost:${PORT}         ║
║   Press Ctrl+C to stop                           ║
╚══════════════════════════════════════════════════╝
    `);
});

module.exports = app;
