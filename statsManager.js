const fs = require('fs').promises;
const path = require('path');

class StatsManager {
    constructor(config = {}, fileSystem = fs) {
        this.config = {
            statsFile: path.join(__dirname, 'counting_stats.json'),
            ...config
        };
        this.fs = fileSystem;
        this.stats = {
            highestCount: 1,
            highestCountTimestamp: null,
            totalSuccessfulCounts: 0,
            currentCount: 1,
            milestones: {},
            userStats: {},
            mostComplicatedOperation: {
                expression: '',
                user: null,
                complexity: 0
            }
        };
        this.currentCount = this.stats.currentCount;
        this.lastUser = null;
        // Remove this.currentCount
    }

    async loadStats() {
        try {
            const data = await this.fs.readFile(this.config.statsFile, 'utf8');
            const loadedStats = JSON.parse(data);
            this.stats = {
                ...loadedStats,
                mostComplicatedOperation: loadedStats.mostComplicatedOperation || {
                    expression: '',
                    user: null,
                    complexity: 0
                },
                userStats: Object.fromEntries(
                    Object.entries(loadedStats.userStats || {}).map(([userId, userStat]) => [
                        userId,
                        {
                            ...userStat,
                            totalComplexity: userStat.totalComplexity || 0,
                            countWithComplexity: userStat.countWithComplexity || 0
                        }
                    ])
                )
            };
            this.currentCount = loadedStats.currentCount || 1;
            this.lastUser = loadedStats.lastUser || null;
            console.log('Stats loaded successfully');
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('No existing stats file found. Starting with default stats.');
            } else {
                console.error('Error loading stats:', error);
            }
        }
    }

    async saveStats() {
        try {
            const dataToSave = {
                ...this.stats,
                currentCount: this.currentCount,
                lastUser: this.lastUser
            };
            await this.fs.writeFile(this.config.statsFile, JSON.stringify(dataToSave, null, 2));
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }

    getStats() {
        return this.stats;
    }

    updateStats(newStats) {
        this.stats = {...this.stats, ...newStats};
    }

    getCurrentCount() {
        return this.stats.currentCount;
    }

    setCurrentCount(count) {
        this.currentCount = count;
        this.stats.currentCount = count;
    }

    getLastUser() {
        return this.lastUser;
    }

    setLastUser(user) {
        this.lastUser = user;
    }
}

// Create and export a singleton instance
const statsManager = new StatsManager();

module.exports = statsManager;

// Also export the class for testing purposes
module.exports.StatsManager = StatsManager;
