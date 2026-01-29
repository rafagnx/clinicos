import express from 'express';

export const createMarketingRoutes = (pool, requireAuth) => {
    const router = express.Router();

    // Middleware to check for marketing feature flag
    const requireMarketingFeature = async (req, res, next) => {
        // req.auth should be populated by requireAuth
        if (!req.auth || !req.auth.organizationId) {
            return res.status(401).json({ error: "Unauthorized: No Organization Context" });
        }

        try {
            const orgRes = await pool.query('SELECT metadata FROM organization WHERE id = $1', [req.auth.organizationId]);
            if (orgRes.rows.length === 0) return res.status(404).json({ error: "Organization not found" });

            let metadata = orgRes.rows[0].metadata;
            if (typeof metadata === 'string') {
                try { metadata = JSON.parse(metadata); } catch (e) { metadata = {}; }
            }
            metadata = metadata || {};

            // Allow if feature flag is true OR if it's the specific specific admin email
            // (Short-circuit for dev/demo purposes)
            const isAuthorized =
                metadata?.features?.marketing === true ||
                metadata?.marketing_module === true ||
                req.auth.user?.email === 'marketingorofacial@gmail.com' ||
                req.auth.isSystemAdmin;

            if (!isAuthorized) {
                return res.status(403).json({ error: "Funcionalidade não contratada (Marketing Module)" });
            }
            next();
        } catch (e) {
            console.error("Feature flag check error:", e);
            res.status(500).json({ error: "Server error checking permissions" });
        }
    };

    // Apply Auth and Feature Check
    router.use(requireAuth);
    router.use(requireMarketingFeature);

    // GET Events (Month range or all)
    router.get('/events', async (req, res) => {
        try {
            // Optional: Filter by date range ?start=2024-01-01&end=2024-02-01
            const { start, end } = req.query;
            let query = 'SELECT * FROM calendar_events WHERE organization_id = $1';
            const params = [req.auth.organizationId];

            if (start && end) {
                query += ' AND date >= $2 AND date <= $3';
                params.push(start, end);
            }

            query += ' ORDER BY date ASC';

            const { rows } = await pool.query(query, params);
            res.json(rows);
        } catch (e) {
            console.error("Fetch events error:", e);
            res.status(500).json({ error: e.message });
        }
    });

    // POST Event (Create)
    router.post('/events', async (req, res) => {
        const { date, content, category, platform, status, notes } = req.body;

        // Simple Validation
        if (!date || !content) {
            return res.status(400).json({ error: "Date and Content are required" });
        }

        try {
            const { rows } = await pool.query(
                `INSERT INTO calendar_events 
                (organization_id, date, content, category, platform, status, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
                 RETURNING *`,
                [
                    req.auth.organizationId,
                    date,
                    content,
                    category || 'post',
                    platform || 'instagram',
                    status || 'planned'
                ]
            );
            res.json(rows[0]);
        } catch (e) {
            console.error("Create event error:", e);
            res.status(500).json({ error: e.message });
        }
    });

    // PUT Event (Update)
    router.put('/events/:id', async (req, res) => {
        const { id } = req.params;
        const { date, content, category, platform, status } = req.body;

        try {
            const { rows } = await pool.query(
                `UPDATE calendar_events
                 SET date = $1, content = $2, category = $3, platform = $4, status = $5
                 WHERE id = $6 AND organization_id = $7
                 RETURNING *`,
                [date, content, category, platform, status, id, req.auth.organizationId]
            );

            if (rows.length === 0) return res.status(404).json({ error: "Event not found" });
            res.json(rows[0]);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // DELETE Event
    router.delete('/events/:id', async (req, res) => {
        try {
            const { rowCount } = await pool.query(
                'DELETE FROM calendar_events WHERE id = $1 AND organization_id = $2',
                [req.params.id, req.auth.organizationId]
            );

            if (rowCount === 0) return res.status(404).json({ error: "Event not found" });
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    return router;
};
