// Script para gerenciar organizações e usuários - ADMIN
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Permitir conexão com certificado self-signed (local/Render pooler)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function adminTools() {
    console.log('🔧 ClinicOS Admin Tools\n');

    try {
        // 1. Listar todas as organizações
        console.log('📋 Organizações cadastradas:');
        const orgs = await pool.query('SELECT id, name, slug, subscription_status FROM "organization" ORDER BY "createdAt" DESC');

        if (orgs.rows.length === 0) {
            console.log('   Nenhuma organização encontrada.\n');
        } else {
            orgs.rows.forEach((org, i) => {
                console.log(`   ${i + 1}. ${org.name} (${org.slug})`);
                console.log(`      ID: ${org.id}`);
                console.log(`      Status: ${org.subscription_status || 'N/A'}\n`);
            });
        }

        // 2. Listar todos os usuários
        console.log('👥 Usuários cadastrados:');
        const users = await pool.query('SELECT id, name, email, role FROM "user" ORDER BY "createdAt" DESC');

        if (users.rows.length === 0) {
            console.log('   Nenhum usuário encontrado.\n');
        } else {
            users.rows.forEach((user, i) => {
                console.log(`   ${i + 1}. ${user.name} (${user.email})`);
                console.log(`      ID: ${user.id}`);
                console.log(`      Role: ${user.role || 'user'}\n`);
            });
        }

        // 3. Comandos úteis
        console.log('🛠️  Comandos Úteis:\n');
        console.log('Para APAGAR uma organização:');
        console.log('   DELETE FROM "organization" WHERE id = \'COLE_O_ID_AQUI\';');
        console.log('   OU');
        console.log('   DELETE FROM "organization" WHERE slug = \'nome-da-empresa\';');
        console.log('');

        console.log('Para ATIVAR PRO em uma organização:');
        console.log('   UPDATE "organization" SET subscription_status = \'active\' WHERE id = \'COLE_O_ID_AQUI\';');
        console.log('   OU');
        console.log('   UPDATE "organization" SET subscription_status = \'active\' WHERE slug = \'nome-da-empresa\';');
        console.log('');

        console.log('Para APAGAR TODAS as organizações (CUIDADO!):');
        console.log('   DELETE FROM "organization";');
        console.log('');

        console.log('Para tornar um usuário ADMIN:');
        console.log('   UPDATE "user" SET role = \'admin\' WHERE email = \'email@exemplo.com\';');
        console.log('');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

adminTools();
