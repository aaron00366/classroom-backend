import { and, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import express from 'express';
import { user } from '../db/schema/auth.js';
import { db } from '../db/index.js';

const router = express.Router();

// Get all users with optional search, role filtering and pagination
router.get('/', async (req: express.Request, res: express.Response) => {
    try {
        const MAX_LIMIT = 100;
        const { search, role, page, limit } = req.query;
        const parsedPage = parseInt(page as string, 10);
        const parsedLimit = parseInt(limit as string, 10);
        const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
        const limitPerPage = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, MAX_LIMIT) : 10;

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            filterConditions.push(or(
                ilike(user.name, `%${search}%`),
                ilike(user.email, `%${search}%`)
            ));
        }

        if (typeof role === 'string') {
            filterConditions.push(eq(user.role, role as 'student' | 'teacher' | 'admin'));
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db.select({ count: sql<number>`count(*)` }).from(user).where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const usersList = await db.select({
            ...getTableColumns(user),
        })
            .from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

export default router;
