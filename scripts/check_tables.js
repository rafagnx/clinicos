
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTables() {
    try {
        const tableNames = ['users', 'organizations', 'members', 'professionals'];
        for (const table of tableNames) {
            try {
                const count = await prisma.$queryRawUnsafe(`SELECT count(*) FROM "public"."${table}"`);
                console.log(`Table '${table}' exists. Count:`, count);
            } catch (e) {
                console.log(`Table '${table}' DOES NOT EXIST or error:`, e.message.split('\n')[0]);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkTables();
