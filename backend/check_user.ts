
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
    try {
        const email = 'rafamarketingdb@gmail.com';
        // We don't ask for 'password' field validation yet, just existence
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (user) {
            console.log(`✅ User found:`);
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log(`❌ User ${email} NOT FOUND in database.`);

            const allUsers = await prisma.user.findMany({
                take: 5
            });
            console.log('   Users currently in DB:', allUsers);
        }
    } catch (error) {
        console.error('❌ Error checking user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
