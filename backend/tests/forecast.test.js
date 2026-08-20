const forecastController = require('../src/controllers/forecast.controller');
const { Transaction, Account, Goal } = require('../src/models');
const recurringService = require('../src/services/recurring.service');

// Mock Sequelize models
jest.mock('../src/models', () => ({
    Transaction: {
        sum: jest.fn()
    },
    Account: {
        sum: jest.fn()
    },
    Goal: {
        sum: jest.fn()
    },
    Sequelize: {
        Op: {}
    }
}));

// Mock Recurring Service
jest.mock('../src/services/recurring.service', () => ({
    detectRecurring: jest.fn()
}));

// Mock Logger to avoid cluttering test output
jest.mock('../src/utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

describe('Forecast Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: { entityId: '1', safetyMargin: '15' }
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    test('should calculate forecast correctly with safety margin and healthy status', async () => {
        // Current account balance = 3000
        Account.sum.mockResolvedValue(3000);
        // Reserved in goals = 500 => Available = 2500
        Goal.sum.mockResolvedValue(500);

        // 90-day expenses = 900 => Daily burn rate = 10 => Monthly spend (30d) = 300
        Transaction.sum.mockResolvedValue(900);

        recurringService.detectRecurring.mockResolvedValue([]);

        await forecastController.getForecast(req, res);

        expect(Account.sum).toHaveBeenCalledWith('balance', { where: { entityId: '1' } });
        expect(Goal.sum).toHaveBeenCalledWith('currentAmount', { where: { entityId: '1' } });
        expect(Transaction.sum).toHaveBeenCalled();

        // 15% safety margin on 300 = 45 => recommendedBuffer = 345
        // Available (2500) > recommendedBuffer (345) => HEALTHY
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            currentBalance: 3000,
            reserved: 500,
            available: 2500,
            dailyBurnRate: 10,
            monthlyEstimatedSpend: 300,
            safetyMarginPercent: 15,
            safetyBufferAmount: 45,
            recommendedBuffer: 345,
            healthStatus: 'HEALTHY'
        }));
    });

    test('should report WARNING status when available balance is below recommended buffer but above monthly spend', async () => {
        Account.sum.mockResolvedValue(320);
        Goal.sum.mockResolvedValue(0);
        Transaction.sum.mockResolvedValue(900); // monthly spend = 300, recommendedBuffer = 345
        recurringService.detectRecurring.mockResolvedValue([]);

        await forecastController.getForecast(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            available: 320,
            healthStatus: 'WARNING'
        }));
    });

    test('should report CRITICAL status when available balance is below monthly estimated spend', async () => {
        Account.sum.mockResolvedValue(200);
        Goal.sum.mockResolvedValue(0);
        Transaction.sum.mockResolvedValue(900); // monthly spend = 300
        recurringService.detectRecurring.mockResolvedValue([]);

        await forecastController.getForecast(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            available: 200,
            healthStatus: 'CRITICAL'
        }));
    });

    test('should handle zero expenses gracefully', async () => {
        Account.sum.mockResolvedValue(0);
        Goal.sum.mockResolvedValue(0);
        Transaction.sum.mockResolvedValue(0);
        recurringService.detectRecurring.mockResolvedValue([]);

        await forecastController.getForecast(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            currentBalance: 0,
            dailyBurnRate: 0,
            projectedBalance: 0,
            healthStatus: 'HEALTHY'
        }));
    });

    test('should return 400 if entityId is missing', async () => {
        req.query.entityId = undefined;
        await forecastController.getForecast(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
