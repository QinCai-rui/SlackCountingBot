const {
    factorial,
    isPrime,
    parseExpression,
    simplifyExpression,
    evaluateExpression
} = require('./mathOperations');
const {calculateComplexity} = require('./complexityCalculator');
const {
    saveStats,
    getStats,
    updateStats,
    getCurrentCount,
    setCurrentCount,
    getLastUser,
    setLastUser
} = require('./statsManager');

async function processMessage(message, say, client) {
    if (!/^[\d+\-*/^√().\s!]+$|^.*sqrt\(.*\).*$/.test(message.text)) {
        return;
    }

    let number;
    let expression;
    let complexity;
    try {
        expression = parseExpression(message.text);
        number = await evaluateExpression(expression);

        complexity = calculateComplexity(message.text);

        const stats = getStats();
        if (complexity > stats.mostComplicatedOperation.complexity) {
            updateStats({
                mostComplicatedOperation: {
                    expression: message.text,
                    user: message.user,
                    complexity: complexity
                }
            });
            await saveStats();
        }

    } catch (error) {
        console.log('Error evaluating expression:', error);
        return;
    }

    const stats = getStats();
    if (!stats.userStats[message.user]) {
        stats.userStats[message.user] = {
            successful: 0,
            unsuccessful: 0,
            totalComplexity: 0,
            countWithComplexity: 0
        };
        updateStats({userStats: stats.userStats});
    }

    const lastUser = getLastUser();
    let currentCount = getCurrentCount();

    if (message.user === lastUser) {
        await handleIncorrectCount(message, say, client, "You can't count twice in a row.");
    } else if (number !== currentCount) {
        await handleIncorrectCount(message, say, client, `The next number should have been ${currentCount}.`);
    } else {
        await handleCorrectCount(message, say, client, number, complexity);
    }
}

async function handleIncorrectCount(message, say, client, reason) {
    await say(`<@${message.user}> messed up! ${reason} The count resets to 1.`);
    setCurrentCount(1);
    updateStats({currentCount: 1});
    setLastUser(null);
    const stats = getStats();
    stats.userStats[message.user].unsuccessful++;
    updateStats({userStats: stats.userStats});
    await client.reactions.add({
        channel: message.channel,
        timestamp: message.ts,
        name: 'x'
    });
    await saveStats();
}

async function handleCorrectCount(message, say, client, number, complexity) {
    try {
        let reactionEmoji = getReactionEmoji(number);
        await client.reactions.add({
            channel: message.channel,
            timestamp: message.ts,
            name: reactionEmoji
        });

        await checkAndHandleMilestones(message, say, number);

        updateGameState(message.user, number, complexity);
        await saveStats();
    } catch (error) {
        console.error(error);
    }
}

function getReactionEmoji(number) {
    if (number === 69) return 'cancer';
    if (number % 100 === 0) return '💯';
    return 'white_check_mark';
}

async function checkAndHandleMilestones(message, say, number) {
    const specialMilestones = [42, 69, 420, 666];
    if (number % 100 === 0 || specialMilestones.includes(number)) {
        const stats = getStats();
        stats.milestones[number] = message.user;
        updateStats({milestones: stats.milestones});
        await say(`🎉 Congratulations <@${message.user}>! You've reached ${number}! 🎉`);
    }
}

function updateGameState(user, number, complexity) {
    const stats = getStats();
    let currentCount = getCurrentCount();

    currentCount++;
    setCurrentCount(currentCount);
    updateStats({currentCount: currentCount});
    setLastUser(user);
    stats.totalSuccessfulCounts++;
    stats.userStats[user].successful++;
    stats.userStats[user].totalComplexity += complexity;
    stats.userStats[user].countWithComplexity++;
    if (currentCount > stats.highestCount) {
        stats.highestCount = currentCount - 1;
        stats.highestCountTimestamp = new Date().toISOString();
    }
    updateStats(stats);

    // Track prime numbers
    if (isPrime(currentCount - 1)) {
        stats.userStats[user].primes = (stats.userStats[user].primes || 0) + 1;
    }

    // Track perfect squares
    if (Math.sqrt(currentCount - 1) % 1 === 0) {
        stats.userStats[user].perfectSquares = (stats.userStats[user].perfectSquares || 0) + 1;
    }

    updateStats({userStats: stats.userStats});
}

module.exports = {processMessage};
