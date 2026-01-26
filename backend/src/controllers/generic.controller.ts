import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

// Utility to map snake_case to camelCase for Prisma
const snakeToCamel = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj;
    if (Array.isArray(obj)) return obj.map(snakeToCamel);

    const newObj: any = {};
    Object.keys(obj).forEach(key => {
        const camelKey = key.replace(/(_\w)/g, k => k[1].toUpperCase());
        newObj[camelKey] = snakeToCamel(obj[key]);
    });
    return newObj;
};

// Utility to map camelCase to snake_case for Frontend
const camelToSnake = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(camelToSnake);
    if (obj instanceof Date) return obj;

    const newObj: any = {};
    Object.keys(obj).forEach(key => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        newObj[snakeKey] = camelToSnake(obj[key]);
    });
    return newObj;
};

export const listEntity = (modelName: string) => async (req: Request, res: Response) => {
    const organizationId = req.headers['x-organization-id'] as string;

    try {
        const prismaModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        const where = snakeToCamel(req.query);

        if (organizationId) {
            where.organizationId = organizationId;
        }

        // @ts-ignore
        const data = await prisma[prismaModelName].findMany({ where });
        res.json({
            data: data.map((item: any) => camelToSnake(item)),
            meta: { total: data.length }
        });
    } catch (error) {
        console.error(`List ${modelName} Error:`, error);
        res.status(500).json({ error: `Failed to fetch ${modelName}` });
    }
};

export const getEntity = (modelName: string) => async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    try {
        const prismaModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        const where: any = { id: isNaN(Number(id)) ? id : Number(id) };
        if (organizationId) where.organizationId = organizationId;

        // @ts-ignore
        const item = await prisma[prismaModelName].findFirst({ where });
        if (!item) return res.status(404).json({ error: "Not found" });
        res.json(camelToSnake(item));
    } catch (error) {
        res.status(500).json({ error: `Fetch ${modelName} failed` });
    }
};

export const createEntity = (modelName: string) => async (req: Request, res: Response) => {
    const organizationId = req.headers['x-organization-id'] as string;

    try {
        const prismaModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        const data = snakeToCamel(req.body);

        if (organizationId && !data.organizationId) {
            data.organizationId = organizationId;
        }

        // @ts-ignore
        const item = await prisma[prismaModelName].create({ data });
        res.status(201).json(camelToSnake(item));
    } catch (error: any) {
        console.error(`Create ${modelName} Error:`, error);
        res.status(400).json({ error: error.message });
    }
};

export const updateEntity = (modelName: string) => async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    try {
        const prismaModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        const data = snakeToCamel(req.body);
        const where: any = { id: isNaN(Number(id)) ? id : Number(id) };
        if (organizationId) where.organizationId = organizationId;

        // @ts-ignore
        const result = await prisma[prismaModelName].updateMany({ where, data });
        if (result.count === 0) return res.status(404).json({ error: "Not found" });

        // @ts-ignore
        const updated = await prisma[prismaModelName].findUnique({
            where: { id: isNaN(Number(id)) ? id : Number(id) }
        });
        res.json(camelToSnake(updated));
    } catch (error: any) {
        console.error(`Update ${modelName} Error:`, error);
        res.status(400).json({ error: error.message });
    }
};

export const deleteEntity = (modelName: string) => async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    try {
        const prismaModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        const where: any = { id: isNaN(Number(id)) ? id : Number(id) };
        if (organizationId) where.organizationId = organizationId;

        // @ts-ignore
        await prisma[prismaModelName].deleteMany({ where });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: `Deletion of ${modelName} failed` });
    }
};
