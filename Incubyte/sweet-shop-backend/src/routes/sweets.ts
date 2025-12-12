import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Sweet } from '../models/Sweet';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { Op } from 'sequelize';

const router = Router();

// POST /api/sweets - Add a new sweet (Protected, Admin only)
router.post(
    '/',
    authenticate,
    requireAdmin,
    [
        body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        body('category').isIn(['Chocolate', 'Candy', 'Gummy', 'Hard Candy', 'Lollipop', 'Toffee', 'Caramel', 'Other'])
            .withMessage('Invalid category'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
    ],
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { name, category, price, quantity } = req.body;

            const sweet = await Sweet.create({
                name,
                category,
                price,
                quantity
            });

            res.status(201).json({
                message: 'Sweet added successfully',
                sweet
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// GET /api/sweets - View all sweets (Protected)
router.get(
    '/',
    authenticate,
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const sweets = await Sweet.findAll({ order: [['createdAt', 'DESC']] });
            res.status(200).json({ sweets });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// GET /api/sweets/search - Search for sweets (Protected)
router.get(
    '/search',
    authenticate,
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { name, category, minPrice, maxPrice } = req.query;

            const where: any = {};

            if (name) {
                where.name = { [Op.like]: `%${name}%` };
            }

            if (category) {
                where.category = category;
            }

            if (minPrice || maxPrice) {
                where.price = {};
                if (minPrice) where.price[Op.gte] = parseFloat(minPrice as string);
                if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice as string);
            }

            const sweets = await Sweet.findAll({
                where,
                order: [['createdAt', 'DESC']]
            });

            res.status(200).json({ sweets, count: sweets.length });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// PUT /api/sweets/:id - Update a sweet (Protected, Admin only)
router.put(
    '/:id',
    authenticate,
    requireAdmin,
    [
        body('name').optional().trim().isLength({ min: 2 }),
        body('category').optional().isIn(['Chocolate', 'Candy', 'Gummy', 'Hard Candy', 'Lollipop', 'Toffee', 'Caramel', 'Other']),
        body('price').optional().isFloat({ min: 0 }),
        body('quantity').optional().isInt({ min: 0 })
    ],
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { id } = req.params;
            const updates = req.body;

            const sweet = await Sweet.findByPk(id);

            if (!sweet) {
                res.status(404).json({ error: 'Sweet not found' });
                return;
            }

            await sweet.update(updates);

            res.status(200).json({
                message: 'Sweet updated successfully',
                sweet
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// DELETE /api/sweets/:id - Delete a sweet (Protected, Admin only)
router.delete(
    '/:id',
    authenticate,
    requireAdmin,
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const sweet = await Sweet.findByPk(id);

            if (!sweet) {
                res.status(404).json({ error: 'Sweet not found' });
                return;
            }

            await sweet.destroy();

            res.status(200).json({
                message: 'Sweet deleted successfully',
                sweet
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

export default router;
