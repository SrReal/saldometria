const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { User, Entity } = require('../src/models');

jest.mock('../src/utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

jest.mock('../src/models', () => {
    const originalModule = jest.requireActual('../src/models');
    return {
        ...originalModule,
        User: {
            findOne: jest.fn(),
            findByPk: jest.fn(),
            create: jest.fn(),
        },
        Entity: {
            findByPk: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
        },
        Transaction: {
            findAll: jest.fn(),
            findAndCountAll: jest.fn(),
            sum: jest.fn(),
            create: jest.fn(),
        },
        Account: {
            sum: jest.fn(),
            findByPk: jest.fn(),
        },
        Goal: {
            sum: jest.fn(),
        },
        sequelize: {
            authenticate: jest.fn().mockResolvedValue(),
            sync: jest.fn().mockResolvedValue()
        }
    };
});

describe('Authentication Flow (/api/auth)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        test('should register a new user and return a JWT token', async () => {
            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue({
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                currency: 'EUR'
            });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'Test@example.com ',
                    password: 'password123',
                    name: 'Test User',
                    invitationCode: process.env.INVITATION_CODE || 'SALDOMETRIA2026'
                });

            expect(response.status).toBe(201);
            expect(response.body.ok).toBe(true);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('email', 'test@example.com');
        });

        test('should reject registration if email is already taken', async () => {
            User.findOne.mockResolvedValue({ id: 1, email: 'test@example.com' });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    invitationCode: process.env.INVITATION_CODE || 'SALDOMETRIA2026'
                });

            expect(response.status).toBe(409);
            expect(response.body.message).toMatch(/already exists/i);
        });

        test('should reject registration if invitation code is required and invalid', async () => {
            const originalCode = process.env.INVITATION_CODE;
            process.env.INVITATION_CODE = 'SECRET_VIP';

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'vip@example.com',
                    password: 'password123',
                    invitationCode: 'WRONG_CODE'
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toMatch(/invitación/i);

            process.env.INVITATION_CODE = originalCode;
        });

        test('should accept registration with valid invitation code when required', async () => {
            const originalCode = process.env.INVITATION_CODE;
            process.env.INVITATION_CODE = 'SECRET_VIP';

            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue({
                id: 2,
                email: 'vip@example.com',
                name: 'VIP User',
                currency: 'EUR'
            });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'vip@example.com',
                    password: 'password123',
                    invitationCode: 'SECRET_VIP'
                });

            expect(response.status).toBe(201);
            expect(response.body.ok).toBe(true);

            process.env.INVITATION_CODE = originalCode;
        });
    });

    describe('POST /api/auth/login', () => {
        test('should login with valid credentials and return a token', async () => {
            const hashedPassword = await bcrypt.hash('secretpassword', 10);
            User.findOne.mockResolvedValue({
                id: 1,
                email: 'user@example.com',
                passwordHash: hashedPassword,
                name: 'User One',
                currency: 'EUR'
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'user@example.com',
                    password: 'secretpassword'
                });

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body).toHaveProperty('token');
        });

        test('should reject login with wrong password', async () => {
            const hashedPassword = await bcrypt.hash('correctpassword', 10);
            User.findOne.mockResolvedValue({
                id: 1,
                email: 'user@example.com',
                passwordHash: hashedPassword
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'user@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/invalid credentials/i);
        });
    });

    describe('Protected Routes & Authorization', () => {
        test('should reject request without Bearer token on protected route', async () => {
            const response = await request(app).get('/api/auth/me');
            expect(response.status).toBe(401);
        });

        test('should allow access with valid Bearer token', async () => {
            const validToken = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'secret_dev');
            User.findByPk.mockResolvedValue({
                id: 1,
                email: 'user@example.com',
                name: 'User One',
                currency: 'EUR'
            });

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.user).toHaveProperty('email', 'user@example.com');
        });
    });
});
