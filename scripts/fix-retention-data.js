/**
 * Script to fix RetentionConfig issues:
 * 1. Remove duplicate procedures
 * 2. Reset return_intervals to correct default values
 * 
 * Run: node scripts/fix-retention-data.js
 */

const { PROCEDURE_CATEGORIES } = require('../lib/procedures.ts');

// Simulated base44 client (replace with actual import if needed)
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

async function fixRetentionData() {
    try {
        console.log('🔧 Starting Retention Data Fix...\n');

        // 1. Fetch all procedures
        const response = await fetch(`${API_URL}/api/procedure_types`);
        const procedures = await response.json();

        console.log(`📊 Found ${procedures.length} procedures\n`);

        // 2. Remove duplicates (keep first occurrence)
        const seen = new Map();
        const duplicates = [];

        procedures.forEach(proc => {
            const key = proc.name.toLowerCase().trim();
            if (seen.has(key)) {
                duplicates.push(proc.id);
                console.log(`❌ Duplicate: ${proc.name} (ID: ${proc.id})`);
            } else {
                seen.set(key, proc);
            }
        });

        console.log(`\n📌 Found ${duplicates.length} duplicates\n`);

        // 3. Delete duplicates
        for (const id of duplicates) {
            await fetch(`${API_URL}/api/procedure_types/${id}`, {
                method: 'DELETE'
            });
            console.log(`🗑️  Deleted duplicate ID: ${id}`);
        }

        // 4. Reset return_intervals to defaults
        console.log('\n🔄 Resetting return intervals to defaults...\n');

        const unique = Array.from(seen.values());
        let updated = 0;

        for (const proc of unique) {
            // Find which category this procedure belongs to
            let correctInterval = 0;

            for (const [catName, catData] of Object.entries(PROCEDURE_CATEGORIES)) {
                const matches = catData.items.some(item =>
                    proc.name.toLowerCase().includes(item.toLowerCase())
                );

                if (matches) {
                    correctInterval = catData.interval || 0;
                    break;
                }
            }

            // Update if different
            if (proc.return_interval !== correctInterval) {
                await fetch(`${API_URL}/api/procedure_types/${proc.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ return_interval: correctInterval })
                });

                console.log(`✅ ${proc.name}: ${proc.return_interval} → ${correctInterval} dias`);
                updated++;
            }
        }

        console.log(`\n✨ Done! Updated ${updated} procedures, deleted ${duplicates.length} duplicates\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixRetentionData();
