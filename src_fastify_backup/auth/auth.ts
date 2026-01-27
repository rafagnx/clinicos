import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../lib/prisma";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "sqlite"
    }),
    emailAndPassword: {
        enabled: true
    },
    plugins: [
        organization({
            async sendInvitationEmail(data) {
                console.log("SEND INVITE EMAIL:", data);
            }
        })
    ],
    trustedOrigins: ["http://localhost:5173"],
});
