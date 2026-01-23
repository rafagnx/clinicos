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

        // CHECK: Verificar se coluna role existe
        try {
            await pool.query('SELECT role FROM "user" LIMIT 1');
        } catch (e) {
            console.log('⚠️ Coluna role não encontrada. Criando...');
            await pool.query('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role TEXT DEFAULT \'user\'');
            console.log('✅ Coluna role criada.');
        }

        // 2. Listar todos os usuários
        console.log('👥 Usuários cadastrados:');
        const users = await pool.query('SELECT id, name, email, role FROM "user" ORDER BY "createdAt" DESC');

        let targetUser = null;

        if (users.rows.length === 0) {
            console.log('   Nenhum usuário encontrado.\n');
        } else {
            users.rows.forEach((user, i) => {
                console.log(`   ${i + 1}. ${user.name} (${user.email})`);
                console.log(`      ID: ${user.id}`);
                console.log(`      Role: ${user.role || 'user'}\n`);
                if (user.email === 'rafamarketingdb@gmail.com') targetUser = user;
            });
        }

        // AUTO-FIX: Promover Rafa a Admin
        if (targetUser && targetUser.role !== 'admin') {
            console.log('🔄 Promovendo Rafa a ADMIN...');
            await pool.query('UPDATE "user" SET role = $1 WHERE email = $2', ['admin', 'rafamarketingdb@gmail.com']);
            console.log('✅ SUCESSO! Rafa agora é ADMIN.\n');
        } else if (targetUser) {
            console.log('✅ Rafa já é ADMIN.\n');

            // CHECK: Verificar se Rafa tem organização
            const memberCheck = await pool.query('SELECT * FROM "member" WHERE "userId" = $1', [targetUser.id]);
            if (memberCheck.rows.length === 0) {
                console.log('⚠️ Rafa não tem organização. Criando uma padrão...');

                // Criar Org
                const newOrgRes = await pool.query(`
                    INSERT INTO "organization" (id, name, slug, subscription_status, "createdAt", "updatedAt")
                    VALUES (gen_random_uuid(), 'Minha Clínica', 'minha-clinica-admin', 'active', NOW(), NOW())
                    RETURNING id
                `);
                const newOrgId = newOrgRes.rows[0].id;

                // Vincular Rafa
                await pool.query(`
                    INSERT INTO "member" (id, "organizationId", "userId", role, "createdAt", "updatedAt")
                    VALUES (gen_random_uuid(), $1, $2, 'owner', NOW(), NOW())
                `, [newOrgId, targetUser.id]);

                console.log('✅ Organização criada e vinculada com sucesso!');
            }
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
