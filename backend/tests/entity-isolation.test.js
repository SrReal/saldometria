const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { User, Entity, Transaction } = require('../src/models');

jest.mock('../src/utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

jest.mock('../src/models', () => {
    return {
        User: {
            findByPk: jest.fn(),
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
        Category: {
            findAll: jest.fn(),
        },
        Account: {
            findAll: jest.fn(),
            findByPk: jest.fn(),
            sum: jest.fn(),
        },
        Rule: {
            findAll: jest.fn(),
        },
        Budget: {
            findAll: jest.fn(),
        },
        Goal: {
            findAll: jest.fn(),
            sum: jest.fn(),
        },
        Alert: {
            findAll: jest.fn(),
        },
        sequelize: {
            authenticate: jest.fn().mockResolvedValue(),
            sync: jest.fn().mockResolvedValue()
        }
    };
});

describe('Multi-Entity Isolation Tests', () => {
    const user1Token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'secret_dev');
    const user2Token = jwt.sign({ userId: 2 }, process.env.JWT_SECRET || 'secret_dev');

    beforeEach(() => {
        jest.clearAllMocks();
        // Default: Token userId=1 belongs to User 1
        User.findByPk.mockImplementation((id) => {
            if (id === 1) return Promise.resolve({ id: 1, email: 'user1@example.com' });
            if (id === 2) return Promise.resolve({ id: 2, email: 'user2@example.com' });
            return Promise.resolve(null);
        });
    });

    test('User 1 cannot access transactions of an Entity owned by User 2', async () => {
        // Entity 99 belongs to userId: 2
        Entity.findByPk.mockResolvedValue({
            id: 99,
            name: 'Entity User 2',
            userId: 2
        });

        const response = await request(app)
            .get('/api/transactions')
            .query({ entityId: '99' })
            .set('Authorization', `Bearer ${user1Token}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/not authorized/i);
    });

    test('User 1 can access transactions of an Entity they own', async () => {
        // Entity 1 belongs to userId: 1
        Entity.findByPk.mockResolvedValue({
            id: 1,
            name: 'Entity User 1',
            userId: 1
        });

        Transaction.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{ id: 101, description: 'Test expense', amount: 50 }]
        });

        const response = await request(app)
            .get('/api/transactions')
            .query({ entityId: '1' })
            .set('Authorization', `Bearer ${user1Token}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
    });
});
