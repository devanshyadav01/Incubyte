import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const router = Router();

// Registration endpoint
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { email, password } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                res.status(400).json({ error: 'User already exists' });
                return;
            }

            // Check if this is the first user (will be admin)
            const userCount = await User.count();
            const isFirstUser = userCount === 0;

            // Create new user
            const user = await User.create({
                email,
                password,
                isAdmin: isFirstUser
            });

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email, isAdmin: user.isAdmin },
                process.env.JWT_SECRET!,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    isAdmin: user.isAdmin
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Login endpoint
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ where: { email } });
            if (!user) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Check password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email, isAdmin: user.isAdmin },
                process.env.JWT_SECRET!,
                { expiresIn: '7d' }
            );

            res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    isAdmin: user.isAdmin
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

export default router;
