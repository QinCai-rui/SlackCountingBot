const fs = require('fs').promises;
const path = require('path');

const STATS_FILE = path.join(__dirname, 'counting_stats.json');

let stats = {
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

let currentCount = 1;
let lastUser = null;

async function loadStats() {
    try {
        const data = await fs.readFile(STATS_FILE, 'utf8');
        const loadedStats = JSON.parse(data);
        stats = {
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
        currentCount = loadedStats.currentCount || 1;
        lastUser = loadedStats.lastUser || null;
        console.log('Stats loaded successfully');
    } catch (error) {
        if (error.code === 'ENOENT') {
            stats = {
                highestCount: 1,
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
        } else {
            console.error('Error loading stats:', error);
        }
    }
}

async function saveStats() {
    try {
        const dataToSave = {
            ...stats,
            currentCount: currentCount,
            lastUser: lastUser
        };
        await fs.writeFile(STATS_FILE, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
        console.error('Error saving stats:', error);
    }
}

function getStats() {
    return stats;
}

function updateStats(newStats) {
    stats = {...stats, ...newStats};
}

function getCurrentCount() {
    return currentCount;
}

function setCurrentCount(count) {
    currentCount = count;
}

function getLastUser() {
    return lastUser;
}

function setLastUser(user) {
    lastUser = user;
}

module.exports = {
    loadStats,
    saveStats,
    getStats,
    updateStats,
    getCurrentCount,
    setCurrentCount,
    getLastUser,
    setLastUser
};
