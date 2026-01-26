import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

export const getMe = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                memberships: {
                    include: { organization: true }
                }
            }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const body = req.body;

        // User fields mapping
        // Frontend uses photo_url, Backend schema uses image for User
        const userData: any = {
            name: body.display_name || body.name,
            image: body.photo_url || body.image,
            phone: body.phone,
            specialty: body.specialty,
        };

        // Remove undefined values to avoid Prisma errors
        Object.keys(userData).forEach(key => userData[key] === undefined && delete userData[key]);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: userData
        });

        // Sync with Professional profile if email matches
        if (updatedUser.email) {
            const professionalData: any = {
                name: userData.name,
                phone: userData.phone,
                photoUrl: userData.image,
                specialty: userData.specialty,
                roleType: body.user_type,
            };

            // Remove undefined for updateMany
            Object.keys(professionalData).forEach(key => professionalData[key] === undefined && delete professionalData[key]);

            await prisma.professional.updateMany({
                where: { email: updatedUser.email },
                data: professionalData
            });
        }

        res.json(updatedUser);
    } catch (error: any) {
        console.error("Update Profile Error:", error);
        res.status(400).json({ error: error.message });
    }
};
