import { and, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import express from 'express';
import { departments, subjects } from '../db/schema/index.js';
import { db } from '../db/index.js';

const router = express.Router();

// Get all subjects with optional search search, filtering and pagination
router.get('/', async (req: express.Request, res: express.Response) => {
    try {
        const MAX_LIMIT = 100;
        const { search, department, page, limit } = req.query;
        const parsedPage = parseInt(page as string, 10);
        const parsedLimit = parseInt(limit as string, 10);
        const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
        const limitPerPage = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, MAX_LIMIT) : 10;

        const offset = (currentPage - 1) * limitPerPage

        const filterConditions = [];

        // If search query exists, filter by subject name OR subject code
        if (search) {
            filterConditions.push(or(
                ilike(subjects.name, `%${search}%`),
                ilike(subjects.code, `%${search}%`)
            ))
        }

        // If departmentId query exists, filter by departmentId
        if (typeof department === 'string') {
            const deptPattern = `%${department.replace(/[%_]/g, '\\$&')}%`
            filterConditions.push(ilike(departments.name, deptPattern))
        }

        //Combine all filters using AND if any exist
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db.select({ count: sql<number>`count(*)` }).from(subjects).leftJoin(departments, eq(subjects.departmentId, departments.id)).where(whereClause)

        const totalCount = countResult[0]?.count ?? 0;

        const subjectsList = await db.select({
            ...getTableColumns(subjects),
            department: getTableColumns(departments)
        })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: subjectsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        })

    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ error: 'Failed to get subjects' })
    }
})

export default router;