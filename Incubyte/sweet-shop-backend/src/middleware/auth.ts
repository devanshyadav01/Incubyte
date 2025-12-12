import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        isAdmin: boolean;
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            id: number;
            email: string;
            isAdmin: boolean;
        };

        const user = await User.findByPk(decoded.id);

        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        req.user = {
            id: user.id,
            email: user.email,
            isAdmin: user.isAdmin
        };

        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
