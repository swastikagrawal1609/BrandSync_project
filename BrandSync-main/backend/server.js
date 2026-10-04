const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. LOGIN & PERSISTENCE ---
app.post('/api/login', async (req, res) => {
    const { userId, role } = req.body;
    try {
        // Record login in Supabase
        await db.query('INSERT INTO Login_Logs (user_id, role) VALUES ($1, $2)', [userId, role]);

        if (role === 'Artist') {
            const check = await db.query('SELECT * FROM Artist WHERE name = $1', [userId]);
            if (check.rows.length === 0) {
                const result = await db.query(
                    'INSERT INTO Artist (name, social_handle, genre, follower_count) VALUES ($1, $2, $3, $4) RETURNING *',
                    [userId, `@${userId.toLowerCase().replace(/\s/g, '')}`, 'New Talent', 0]
                );
                return res.json({ success: true, user: { ...result.rows[0], role } });
            }
            return res.json({ success: true, user: { ...check.rows[0], role } });
        } 
        
        if (role === 'Brand') {
            const check = await db.query('SELECT * FROM Brand WHERE company_name = $1', [userId]);
            if (check.rows.length === 0) {
                const result = await db.query(
                    'INSERT INTO Brand (company_name, industry, annual_marketing_budget) VALUES ($1, $2, $3) RETURNING *',
                    [userId, 'General', 1000000]
                );
                return res.json({ success: true, user: { ...result.rows[0], role } });
            }
            return res.json({ success: true, user: { ...check.rows[0], role } });
        }

        res.json({ success: true, user: { name: userId, role, id: 999 } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- 2. DEALS ---
app.get('/api/deals', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT d.*, b.company_name AS brand_name 
            FROM Deal d 
            LEFT JOIN Brand b ON d.brand_id = b.brand_id
            ORDER BY d.deal_id DESC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/deals', async (req, res) => {
    const { title, budget, brand_id, start_date } = req.body;
    try {
        await db.query(
            'INSERT INTO Deal (campaign_title, total_budget, brand_id, start_date, status) VALUES ($1, $2, $3, $4, $5)',
            [title, parseFloat(budget), brand_id, start_date, 'Active']
        );
        res.status(201).json({ message: "Deal Created" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 3. ARTISTS ---
app.get('/api/artists', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM Artist ORDER BY artist_id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

app.put('/api/artists/:id', async (req, res) => {
    const { id } = req.params;
    const { social_handle, email, bio, website_url, follower_count, genre } = req.body;
    try {
        const result = await db.query(
            `UPDATE Artist SET social_handle=$1, email=$2, bio=$3, website_url=$4, follower_count=$5, genre=$6 WHERE artist_id=$7 RETURNING *`,
            [social_handle, email, bio, website_url, parseInt(follower_count) || 0, genre, id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 4. BRANDS & LOGS ---
app.get('/api/brands', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM Brand ORDER BY brand_id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/login-logs', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM Login_Logs ORDER BY login_timestamp DESC LIMIT 10');
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 BrandSync Server running on port ${PORT}`));