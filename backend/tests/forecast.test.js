const forecastController = require('../src/controllers/forecast.controller');
const { Transaction } = require('../src/models');

// Mock Sequelize models
jest.mock('../src/models', () => ({
    Transaction: {
        findAll: jest.fn(),
        sum: jest.fn()
    },
    Sequelize: {
        Op: {}
    }
}));

// Mock Logger to avoid cluttering test output
jest.mock('../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn()
}));

describe('Forecast Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: { entityId: '1' }
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    test('should calculate forecast correctly', async () => {
        // Mock current balance: 2000 Income - 1000 Expense = 1000 Balance
        Transaction.findAll.mockResolvedValue([
            { type: 'INCOME', amount: '2000' },
            { type: 'EXPENSE', amount: '1000' }
        ]);

        // Mock 90-day expenses: 900
        // Daily burn rate = 900 / 90 = 10
        Transaction.sum.mockResolvedValue(900);

        await forecastController.getForecast(req, res);

        expect(Transaction.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ entityId: '1', status: 'COMPLETED' })
        }));

        expect(Transaction.sum).toHaveBeenCalled();

        // Calculate expected values
        const today = new Date();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysLeft = Math.ceil((endOfMonth - today) / (1000 * 60 * 60 * 24));
        const validDaysLeft = Math.max(0, daysLeft);
        
        const expectedBurnRate = 10;
        const expectedBalance = 1000 - (10 * validDaysLeft);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            currentBalance: 1000,
            dailyBurnRate: expectedBurnRate,
            daysLeft: validDaysLeft,
            projectedBalance: expectedBalance
        }));
    });

    test('should handle zero expenses gracefully', async () => {
        Transaction.findAll.mockResolvedValue([]);
        Transaction.sum.mockResolvedValue(0);

        await forecastController.getForecast(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            currentBalance: 0,
            dailyBurnRate: 0,
            projectedBalance: 0
        }));
    });

    test('should return 400 if entityId is missing', async () => {
        req.query.entityId = undefined;
        await forecastController.getForecast(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
