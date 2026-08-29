import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { router } from './routes/index.js';
const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH'],
    },
});
app.use(helmet());
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
}));
app.use(morgan('dev'));
app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'ResQNet API is running', data: { status: 'ok' } });
});
app.use('/api/v1', router);
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        code: 'NOT_FOUND',
        details: null,
    });
});
app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: null,
    });
});
io.on('connection', (socket) => {
    socket.emit('connected', { ok: true });
    socket.on('join-user', (userId) => {
        socket.join(`user:${userId}`);
    });
    socket.on('join-role', (role) => {
        socket.join(`role:${role}`);
    });
});
export { app, httpServer };
