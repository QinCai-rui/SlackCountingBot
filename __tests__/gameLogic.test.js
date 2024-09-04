const {
    processMessage,
    getReactionEmoji,
    checkAndHandleMilestones,
    updateGameState
} = require('../gameLogic');

// Mock dependencies
jest.mock('../mathOperations', () => ({
    parseExpression: jest.fn(expr => expr),
    evaluateExpression: jest.fn(async expr => Promise.resolve(Number(expr))),
    isPrime: jest.fn(n => n === 2 || n === 3)
}));
jest.mock('../complexityCalculator', () => ({
    calculateComplexity: jest.fn(() => 1)
}));
jest.mock('../statsManager', () => ({
    getStats: jest.fn(() => ({
        userStats: {
            U123: {successful: 0, unsuccessful: 0, totalComplexity: 0, countWithComplexity: 0}
        },
        milestones: {},
        mostComplicatedOperation: {},
        currentCount: 1,
        totalSuccessfulCounts: 0,
        highestCount: 0
    })),
    updateStats: jest.fn(),
    getCurrentCount: jest.fn(() => 1),
    setCurrentCount: jest.fn(),
    getLastUser: jest.fn(),
    setLastUser: jest.fn(),
    saveStats: jest.fn()
}));

describe('gameLogic', () => {
    describe('processMessage', () => {
        it('should process a valid message', async () => {
            const message = {text: '2+2', user: 'U123'};
            const say = jest.fn();
            const client = {reactions: {add: jest.fn()}};

            await processMessage(message, say, client);

            expect(say).toHaveBeenCalled();
        });

        it('should handle invalid messages', async () => {
            const message = {text: 'invalid', user: 'U123'};
            const say = jest.fn();
            const client = {reactions: {add: jest.fn()}};

            await processMessage(message, say, client);

            expect(say).not.toHaveBeenCalled();
        });
    });

    describe('getReactionEmoji', () => {
        it('should return correct emoji for special numbers', () => {
            expect(getReactionEmoji(42)).toBe('rocket');
            expect(getReactionEmoji(69)).toBe('cancer');  // Changed from 'smirk' to 'cancer'
            expect(getReactionEmoji(666)).toBe('smiling_imp');
        });

        it('should return correct emoji for other special numbers', () => {
            expect(getReactionEmoji(314)).toBe('pie');
            expect(getReactionEmoji(420)).toBe('herb');
            expect(getReactionEmoji(777)).toBe('four_leaf_clover');
            expect(getReactionEmoji(1000)).toBe('fireworks');
            expect(getReactionEmoji(1337)).toBe('computer');
            expect(getReactionEmoji(2048)).toBe('jigsaw');
            expect(getReactionEmoji(3141)).toBe('abacus');
            expect(getReactionEmoji(5000)).toBe('raised_hand_with_fingers_splayed');
            expect(getReactionEmoji(9000)).toBe('muscle');
            expect(getReactionEmoji(12345)).toBe('1234');
        });

        it('should return 💯 for multiples of 100', () => {
            expect(getReactionEmoji(100)).toBe('💯');
            expect(getReactionEmoji(200)).toBe('💯');
        });

        it('should return white_check_mark for other numbers', () => {
            expect(getReactionEmoji(50)).toBe('white_check_mark');
        });
    });

    describe('checkAndHandleMilestones', () => {
        it('should handle milestones', async () => {
            const message = {user: 'U123'};
            const say = jest.fn();

            await checkAndHandleMilestones(message, say, 1000);

            expect(say).toHaveBeenCalledWith(expect.stringContaining('1000'));
        });

        it('should not handle non-milestones', async () => {
            const message = {user: 'U123'};
            const say = jest.fn();

            await checkAndHandleMilestones(message, say, 7);

            expect(say).not.toHaveBeenCalled();
        });
    });

    describe('updateGameState', () => {
        it('should update game state correctly', () => {
            const user = 'U123';
            const number = 2;
            const complexity = 1;

            updateGameState(user, number, complexity);

            // Add expectations based on how updateGameState should behave
            // This might involve checking if certain functions from statsManager were called
        });
    });
});
