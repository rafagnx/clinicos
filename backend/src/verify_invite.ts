
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyInvite() {
    try {
        console.log("🔍 Fetching Organization ID...");
        const org = await prisma.organization.findFirst();

        if (!org) {
            console.error("❌ No organization found to test with.");
            return;
        }
        console.log(`✅ Using Org ID: ${org.id}`);

        console.log("🚀 Testing POST /api/admin/invites...");
        const res = await axios.post('http://localhost:3001/api/admin/invites', {
            email: "test_invite@clinicos.app",
            role: "member"
        }, {
            headers: {
                'Authorization': 'Bearer dev-token',
                'x-organization-id': org.id
            }
        });

        console.log("✅ Response Status:", res.status);
        console.log("✅ Response Data:", res.data);

    } catch (error: any) {
        console.error("❌ Error:", error.response ? error.response.data : error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verifyInvite();
