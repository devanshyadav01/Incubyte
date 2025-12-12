import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Sweet } from '../models/Sweet';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// POST /api/sweets/:id/purchase - Purchase a sweet (Protected)
router.post(
    '/:id/purchase',
    authenticate,
    [
        body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1')
    ],
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { id } = req.params;
            const purchaseQuantity = req.body.quantity || 1;

            const sweet = await Sweet.findByPk(id);

            if (!sweet) {
                res.status(404).json({ error: 'Sweet not found' });
                return;
            }

            if (sweet.quantity < purchaseQuantity) {
                res.status(400).json({
                    error: 'Insufficient quantity',
                    available: sweet.quantity,
                    requested: purchaseQuantity
                });
                return;
            }

            sweet.quantity -= purchaseQuantity;
            await sweet.save();

            res.status(200).json({
                message: 'Purchase successful',
                sweet,
                purchased: purchaseQuantity
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// POST /api/sweets/:id/restock - Restock a sweet (Protected, Admin only)
router.post(
    '/:id/restock',
    authenticate,
    requireAdmin,
    [
        body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
    ],
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { id } = req.params;
            const { quantity } = req.body;

            const sweet = await Sweet.findByPk(id);

            if (!sweet) {
                res.status(404).json({ error: 'Sweet not found' });
                return;
            }

            sweet.quantity += quantity;
            await sweet.save();

            res.status(200).json({
                message: 'Restock successful',
                sweet,
                restocked: quantity
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

export default router;
