const {getStatsMessage, getHelpMessage} = require('../utils');

// Mock the stats object
const mockStats = {
    highestCount: 100,
    highestCountTimestamp: '2023-05-01T12:00:00Z',
    totalSuccessfulCounts: 500,
    userStats: {
        U1234: {successful: 50, unsuccessful: 5, totalComplexity: 100, countWithComplexity: 50},
        U5678: {successful: 40, unsuccessful: 3, totalComplexity: 80, countWithComplexity: 40},
    },
    milestones: {
        '42': 'U1234',
        '69': 'U5678',
        '100': 'U1234',
    },
    mostComplicatedOperation: {
        expression: '2+2*2',
        user: 'U1234',
        complexity: 3,
    },
};

// Improved mock Slack client
const mockClient = {
    users: {
        info: jest.fn().mockImplementation(({user}) => {
            if (user === 'U1234') {
                return Promise.resolve({user: {username: 'johndoe'}});
            } else if (user === 'U5678') {
                return Promise.resolve({user: {username: 'janesmith'}});
            } else {
                return Promise.reject(new Error('User not found'));
            }
        }),
    },
};

describe('getStatsMessage', () => {
    it('generates correct stats message', async () => {
        const message = await getStatsMessage(mockClient, mockStats);

        expect(message).toContain('📊 Counting Game Stats 📊');
        expect(message).toContain('Highest count: 100');
        expect(message).toContain('Achieved on: 5/1/2023, 12:00:00 PM UTC');
        expect(message).toContain('Total successful counts: 500');
        expect(message).toContain('🏆 Top Counters:');
        expect(message).toContain('johndoe: 50 (5 fails, Avg Complexity: 2.00)');
        expect(message).toContain('janesmith: 40 (3 fails, Avg Complexity: 2.00)');
        expect(message).toContain('🎯 Milestones:');
        expect(message).toContain('42: johndoe');
        expect(message).toContain('69: janesmith');
        expect(message).toContain('100: johndoe');
        expect(message).toContain('🧮 Most Complicated Operation:');
        expect(message).toContain('johndoe: 2+2*2 (Complexity: 3)');
    });

    test('handles errors when fetching user info', async () => {
        const errorClient = {
            users: {
                info: jest.fn().mockRejectedValue(new Error('API Error')),
            },
        };

        const message = await getStatsMessage(errorClient, mockStats);

        expect(message).toContain('<@U1234>: 50 (5 fails)');
        expect(message).toContain('<@U5678>: 40 (3 fails)');
        expect(message).toContain('42: <@U1234>');
        expect(message).toContain('69: <@U5678>');
        expect(message).toContain('100: <@U1234>');
        expect(message).toContain('<@U1234>: 2+2*2 (Complexity: 3)');
    });
});

describe('getHelpMessage', () => {
    test('returns correct help message', () => {
        const helpMessage = getHelpMessage();

        expect(helpMessage).toContain('🔢 Welcome to the Counting Game! 🔢');
        expect(helpMessage).toContain('Rules:');
        expect(helpMessage).toContain('1. Count up from 1, one number at a time.');
        expect(helpMessage).toContain('2. Each person can only count once in a row.');
        expect(helpMessage).toContain('3. If someone makes a mistake, the count resets to 1.');
        expect(helpMessage).toContain('You can use basic math operations to represent numbers:');
        expect(helpMessage).toContain('• Addition: 2+3');
        expect(helpMessage).toContain('• Subtraction: 10-7');
        expect(helpMessage).toContain('• Multiplication: 4*3');
        expect(helpMessage).toContain('• Division: 15/3');
        expect(helpMessage).toContain('• Exponents: 2^3');
        expect(helpMessage).toContain('• Square roots: √9 or sqrt(9)');
        expect(helpMessage).toContain('Commands:');
        expect(helpMessage).toContain('• !stats - View game statistics');
        expect(helpMessage).toContain('• !help - Show this help message');
        expect(helpMessage).toContain('Have fun counting! 🎉');
    });
});
