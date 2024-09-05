const {
    processMessage,
    getReactionEmoji,
    checkAndHandleMilestones,
    updateGameState,
    getUnicodeEmoji
} = require('../gameLogic');

// Mock the statsManager module
jest.mock('../statsManager', () => ({
    saveStats: jest.fn(),
    getStats: jest.fn(),
    updateStats: jest.fn(),
    getCurrentCount: jest.fn(),
    setCurrentCount: jest.fn(),
    getLastUser: jest.fn(),
    setLastUser: jest.fn(),
}));

// Import the mocked functions
const {saveStats, getStats, updateStats, getCurrentCount, setCurrentCount, getLastUser, setLastUser} = require('../statsManager');

// Mock the mathOperations module
jest.mock('../mathOperations', () => ({
    parseExpression: jest.fn(x => x),
    evaluateExpression: jest.fn(async () => 4),
    isPrime: jest.fn(),
}));

// Mock the complexityCalculator module
jest.mock('../complexityCalculator', () => ({
    calculateComplexity: jest.fn(() => 3),
}));

describe('gameLogic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('processMessage', () => {
        it('should process a valid message', async () => {
            const message = {text: '2+2', user: 'U123'};
            const say = jest.fn();
            const client = {reactions: {add: jest.fn()}};

            // Mock the necessary functions
            getStats.mockReturnValue({
                userStats: {'U123': {successful: 0, unsuccessful: 0, totalComplexity: 0, countWithComplexity: 0}},
                mostComplicatedOperation: {complexity: 0},
                milestones: {}
            });
            getCurrentCount.mockReturnValue(4);
            getLastUser.mockReturnValue('U456');

            const result = await processMessage(message, say, client);

            // Check if the function returns the expected string
            expect(result).toBe('Expression: 2+2, Evaluated: 4, Complexity: 3');

            // Check if handleCorrectCount was called (indirectly)
            expect(client.reactions.add).toHaveBeenCalled();
            expect(updateStats).toHaveBeenCalled();
            expect(saveStats).toHaveBeenCalled();
        });

        it('should handle invalid messages', async () => {
            const message = {text: 'invalid', user: 'U123'};
            const say = jest.fn();
            const client = {reactions: {add: jest.fn()}};

            const result = await processMessage(message, say, client);

            expect(result).toBeUndefined();
            expect(say).not.toHaveBeenCalled();
            expect(client.reactions.add).not.toHaveBeenCalled();
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

    describe('getUnicodeEmoji', () => {
        it('should return the correct Unicode emoji for known shortcodes', () => {
            expect(getUnicodeEmoji('rocket')).toBe('🚀');
            expect(getUnicodeEmoji('cancer')).toBe('♋');
            expect(getUnicodeEmoji('pie')).toBe('🥧');
            expect(getUnicodeEmoji('herb')).toBe('🌿');
            expect(getUnicodeEmoji('smiling_imp')).toBe('😈');
        });

        it('should return the input if the shortcode is unknown', () => {
            expect(getUnicodeEmoji('unknown_emoji')).toBe('unknown_emoji');
        });

        it('should return the same emoji if it\'s already Unicode', () => {
            expect(getUnicodeEmoji('💯')).toBe('💯');
        });
    });

    describe('checkAndHandleMilestones', () => {
        it('should send a congratulatory message with Unicode emojis for milestones', async () => {
            const message = {user: 'U123'};
            const say = jest.fn();

            getStats.mockReturnValue({milestones: {}});

            await checkAndHandleMilestones(message, say, 69);

            expect(say).toHaveBeenCalledWith('♋ Congratulations <@U123>! You\'ve reached 69! ♋');
            expect(updateStats).toHaveBeenCalledWith({milestones: {'69': 'U123'}});
        });

        it('should not send a message for non-milestone numbers', async () => {
            const message = {user: 'U123'};
            const say = jest.fn();

            await checkAndHandleMilestones(message, say, 68);

            expect(say).not.toHaveBeenCalled();
            expect(updateStats).not.toHaveBeenCalled();
        });
    });

    describe('updateGameState', () => {
        it('should update game state correctly', () => {
            const user = 'U123';
            const number = 2;
            const complexity = 1;

            getStats.mockReturnValue({
                userStats: {U123: {successful: 0, totalComplexity: 0, countWithComplexity: 0}},
                totalSuccessfulCounts: 0,
                highestCount: 0
            });
            getCurrentCount.mockReturnValue(1);

            updateGameState(user, number, complexity);

            // Add expectations based on how updateGameState should behave
            expect(setCurrentCount).toHaveBeenCalledWith(2);
            expect(setLastUser).toHaveBeenCalledWith(user);
            expect(updateStats).toHaveBeenCalled();
        });
    });
});
