const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

jest.mock('../src/utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

describe('Healthcheck Endpoint (GET /api/health)', () => {
    test('should return 200 and status UP when database is connected', async () => {
        jest.spyOn(db.sequelize, 'authenticate').mockResolvedValue();

        const response = await request(app).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'UP');
        expect(response.body).toHaveProperty('database', 'CONNECTED');
        expect(response.body).toHaveProperty('timestamp');
    });

    test('should return 503 and status DOWN when database connection fails', async () => {
        jest.spyOn(db.sequelize, 'authenticate').mockRejectedValue(new Error('Connection timeout'));

        const response = await request(app).get('/api/health');

        expect(response.status).toBe(503);
        expect(response.body).toHaveProperty('status', 'DOWN');
        expect(response.body).toHaveProperty('database', 'DISCONNECTED');
    });
});
