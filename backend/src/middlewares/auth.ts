import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../services/prisma.js';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 1. Verify JWT (if using Supabase, you might verify differently)
        // For now, assuming standard JWT structure or direct Supabase validation
        // Ideally, use supabase-js to verify if it's a Supabase token
        // But since we are migrating logic, let's look at how server/index.js did it:
        // It called supabase.auth.getUser(token)

        // Option A: Verify locally if we have the secret (fastest)
        // Option B: Call Supabase API (more secure, slower) -> As used in server/index.js

        // Let's implement Option B to match legacy behavior first, then optimize.
        // We need SUPABASE_URL and KEY in env if we do this.

        // Allow bypassing for now if env not set, OR verify locally if it's our own JWT
        // For this MVP step, let's decode and check DB.

        // TEMPORARY SUPER ADMIN BYPASS for migration testing & recovery
        if (token === 'dev-token') {
            console.log("⚠️ Using Dev-Token Bypass");
            const adminUser = await prisma.user.findUnique({
                where: { email: 'rafamarketingdb@gmail.com' }
            });

            if (adminUser) {
                req.user = adminUser;
                return next();
            } else {
                console.warn("⚠️ Dev-Token used but admin user not found. Falling back to mock.");
                req.user = { id: 'dev-user', email: 'dev@example.com', role: 'admin' };
                return next();
            }
        }

        // Decoding without verification for MVP Migration Step (REPLACE WITH REAL VERIFICATION)
        const decoded = jwt.decode(token) as any;

        if (!decoded || !decoded.sub) {
            // Fallback: Validate via Supabase (Placeholder)
            // const { data: { user }, error } = await supabase.auth.getUser(token);
            throw new Error("Invalid Token Structure");
        }

        // Sync User Logic (from server/index.js lines 62-100)
        // We should probably move this to a service, but keeping here for direct port
        const user = await prisma.user.findFirst({
            where: { email: decoded.email }
        });

        if (user) {
            req.user = user;
        } else {
            // Auto-create user from Supabase token to ensure local DB consistency
            try {
                // Sanitize massive base64 images to prevent DB bloat/connection resets
                let avatarUrl = decoded.user_metadata?.avatar_url || decoded.user_metadata?.picture;
                if (avatarUrl && avatarUrl.length > 2000) {
                    console.warn(`⚠️ Stripping massive avatar image (${avatarUrl.length} bytes) for user ${decoded.email}`);
                    avatarUrl = null; // or use a default placeholder
                }

                const newUser = await prisma.user.create({
                    data: {
                        id: decoded.sub, // Use Supabase ID as PK
                        email: decoded.email,
                        name: decoded.user_metadata?.full_name || decoded.user_metadata?.name || decoded.email.split('@')[0],
                        image: avatarUrl,
                        emailVerified: decoded.email_verified || false
                    }
                });
                console.log('✅ Created local user for:', decoded.email);
                req.user = newUser;
            } catch (createError) {
                console.error("Failed to auto-create user:", createError);
                return res.status(500).json({ error: "Failed to sync user profile" });
            }
        }

        next();

    } catch (error) {
        console.error('Auth Error:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
