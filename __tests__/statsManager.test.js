const path = require('path');
const {StatsManager} = require('../statsManager');

// Mock fs module
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
    },
}));

// Get the mocked fs module
const fs = require('fs');

describe('StatsManager', () => {
    let statsManager;
    const mockConfig = {statsFile: 'mock_stats.json'};

    beforeEach(() => {
        statsManager = new StatsManager(mockConfig, fs.promises);
        jest.clearAllMocks();
    });

    describe('loadStats', () => {
        it('should load stats from file', async () => {
            const mockStats = JSON.stringify({
                highestCount: 10,
                currentCount: 5,
                lastUser: 'U123',
                userStats: {'U123': {successful: 5}}
            });
            fs.promises.readFile.mockResolvedValue(mockStats);

            await statsManager.loadStats();

            expect(statsManager.getStats().highestCount).toBe(10);
            expect(statsManager.getCurrentCount()).toBe(5);
            expect(statsManager.getLastUser()).toBe('U123');
            expect(statsManager.getStats().userStats['U123'].successful).toBe(5);
        });

        it('should handle file not found error', async () => {
            const error = new Error('File not found');
            error.code = 'ENOENT';
            fs.promises.readFile.mockRejectedValue(error);

            await statsManager.loadStats();

            expect(statsManager.getStats().highestCount).toBe(1);
            expect(statsManager.getCurrentCount()).toBe(1);
            expect(statsManager.getLastUser()).toBeNull();
        });
    });

    describe('saveStats', () => {
        it('should save stats to file', async () => {
            statsManager.stats = {
                highestCount: 20,
                userStats: {'U456': {successful: 10}}
            };
            statsManager.setCurrentCount(15);
            statsManager.setLastUser('U456');

            await statsManager.saveStats();

            expect(fs.promises.writeFile).toHaveBeenCalledWith(
                mockConfig.statsFile,
                expect.any(String)
            );
            const savedData = JSON.parse(fs.promises.writeFile.mock.calls[0][1]);
            expect(savedData.highestCount).toBe(20);
            expect(savedData.currentCount).toBe(15);
            expect(savedData.lastUser).toBe('U456');
        });
    });

    describe('updateStats', () => {
        it('should update stats correctly', () => {
            const newStats = {
                highestCount: 30,
                userStats: {'U789': {successful: 15}}
            };

            statsManager.updateStats(newStats);

            expect(statsManager.getStats().highestCount).toBe(30);
            expect(statsManager.getStats().userStats['U789'].successful).toBe(15);
        });
    });

    describe('getCurrentCount and setCurrentCount', () => {
        it('should get and set current count correctly', () => {
            statsManager.setCurrentCount(25);
            expect(statsManager.getCurrentCount()).toBe(25);
        });
    });

    describe('getLastUser and setLastUser', () => {
        it('should get and set last user correctly', () => {
            statsManager.setLastUser('U999');
            expect(statsManager.getLastUser()).toBe('U999');
        });
    });
});
