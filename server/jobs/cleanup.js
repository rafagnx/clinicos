
import cron from 'node-cron';
import pg from 'pg';

// Cleanup Logic
export const startCleanupJob = (pool) => {
    // Run every day at 03:00 AM
    cron.schedule('0 3 * * *', async () => {
        console.log('🧹 [Cleanup Job] Starting daily cleanup...');

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Delete "Ghost" Organizations (Created > 30 days ago, No Subscription, No Activity)
            // Criteria: Created > 30 days AND status != 'active' AND (no patients OR less than 2 patients)
            const ghostOrgsQuery = `
                DELETE FROM organization 
                WHERE created_at < NOW() - INTERVAL '30 days'
                AND (subscription_status IS NULL OR subscription_status NOT IN ('active', 'manual_override'))
                AND id IN (
                    SELECT o.id 
                    FROM organization o
                    LEFT JOIN patients p ON o.id = p.organization_id
                    GROUP BY o.id
                    HAVING COUNT(p.id) < 2
                )
                RETURNING id, name;
            `;

            const ghostResult = await client.query(ghostOrgsQuery);
            if (ghostResult.rowCount > 0) {
                console.log(`🧹 [Cleanup Job] Deleted ${ghostResult.rowCount} ghost organizations:`, ghostResult.rows.map(r => r.name));
            }

            // 2. Delete "Expired" Organizations (Canceled > 90 days ago)
            const expiredOrgsQuery = `
                DELETE FROM organization 
                WHERE subscription_status = 'canceled'
                AND updated_at < NOW() - INTERVAL '90 days'
                RETURNING id, name;
            `;

            const expiredResult = await client.query(expiredOrgsQuery);
            if (expiredResult.rowCount > 0) {
                console.log(`🧹 [Cleanup Job] Deleted ${expiredResult.rowCount} expired organizations (canceled > 90d):`, expiredResult.rows.map(r => r.name));
            }

            await client.query('COMMIT');
            console.log('🧹 [Cleanup Job] Finished successfully.');

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ [Cleanup Job] Failed:', error);
        } finally {
            client.release();
        }
    });

    console.log('⏰ [Cleanup Job] Scheduled for 03:00 AM daily.');
};
