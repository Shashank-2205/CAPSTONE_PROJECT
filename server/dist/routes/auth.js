import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['citizen', 'volunteer', 'ngo', 'hospital', 'admin']).default('citizen'),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            message: 'Invalid registration data',
            code: 'VALIDATION_ERROR',
            details: parsed.error.flatten(),
        });
    }
    const { name, email, password, role } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
        id: `user_${Date.now()}`,
        name,
        email,
        role,
        passwordHash,
    };
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.jwtSecret, {
        expiresIn: '8h',
    });
    return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        },
    });
});
router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            message: 'Invalid login payload',
            code: 'VALIDATION_ERROR',
            details: parsed.error.flatten(),
        });
    }
    const { email, password } = parsed.data;
    const demoAccounts = {
        'admin@resqnet.com': { id: 'admin_1', name: 'Admin User', role: 'admin', password: 'Admin@123' },
        'citizen@resqnet.com': { id: 'citizen_1', name: 'Citizen User', role: 'citizen', password: 'Citizen@123' },
        'volunteer@resqnet.com': { id: 'volunteer_1', name: 'Volunteer User', role: 'volunteer', password: 'Volunteer@123' },
        'ngo@resqnet.com': { id: 'ngo_1', name: 'NGO User', role: 'ngo', password: 'Ngo@123' },
        'hospital@resqnet.com': { id: 'hospital_1', name: 'Hospital User', role: 'hospital', password: 'Hospital@123' },
    };
    const account = demoAccounts[email.toLowerCase()];
    if (!account || password !== account.password) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS',
            details: null,
        });
    }
    const token = jwt.sign({ id: account.id, email, role: account.role }, env.jwtSecret, {
        expiresIn: '8h',
    });
    return res.json({
        success: true,
        message: 'Login successful',
        data: {
            token,
            user: { id: account.id, name: account.name, email, role: account.role },
        },
    });
});
router.get('/me', authenticate, (req, res) => {
    res.json({
        success: true,
        message: 'Authenticated user loaded',
        data: req.user,
    });
});
router.post('/logout', authenticate, (_req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully',
        data: null,
    });
});
export default router;
