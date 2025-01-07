const {isPrime} = require('./mathOperations');

async function getStatsMessage(client, stats) {
    let message = '📊 Counting Game Stats 📊\n\n';

    message += `Highest count: ${stats.highestCount}\n`;
    if (stats.highestCountTimestamp) {
        const date = new Date(stats.highestCountTimestamp);
        const options = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,  // Use 24-hour clock
            timeZone: 'UTC' // Use the UTC+0 timezone
        };
        message += `Achieved on: ${date.toLocaleString('en-US', options)} UTC\n`;
    }
    message += `Total successful counts: ${stats.totalSuccessfulCounts}\n\n`;

    message += '🏆 Top Counters:\n';
    const sortedUsers = Object.entries(stats.userStats)
        .sort(([, a], [, b]) => b.successful - a.successful)
        .slice(0, 5);

    for (const [userId, userStats] of sortedUsers) {
        try {
            const userInfo = await client.users.info({user: userId});
            const username = userInfo.user.username || userInfo.user.name;
            const avgComplexity = userStats.countWithComplexity > 0
                ? (userStats.totalComplexity / userStats.countWithComplexity).toFixed(2)
                : 'N/A';
            message += `${username}: ${userStats.successful} (${userStats.unsuccessful} fails, Avg Complexity: ${avgComplexity}`;
            if (userStats.primes) message += `, Primes: ${userStats.primes}`;
            if (userStats.perfectSquares) message += `, Perfect Squares: ${userStats.perfectSquares}`;
            message += ')\n';
        } catch (error) {
            message += `<@${userId}>: ${userStats.successful} (${userStats.unsuccessful} fails)\n`;
        }
    }

    message += '\n🎯 Milestones:\n';
    for (const [milestone, userId] of Object.entries(stats.milestones)) {
        try {
            const userInfo = await client.users.info({user: userId});
            const username = userInfo.user.username || userInfo.user.name;
            message += `${milestone}: ${username}\n`;
        } catch (error) {
            message += `${milestone}: <@${userId}>\n`;
        }
    }

    message += '\n🧮 Most Complicated Operation:\n';
    if (stats.mostComplicatedOperation.user) {
        try {
            const userInfo = await client.users.info({user: stats.mostComplicatedOperation.user});
            const username = userInfo.user.username || userInfo.user.name;
            message += `${username}: ${stats.mostComplicatedOperation.expression} (Complexity: ${stats.mostComplicatedOperation.complexity})\n`;
        } catch (error) {
            message += `<@${stats.mostComplicatedOperation.user}>: ${stats.mostComplicatedOperation.expression} (Complexity: ${stats.mostComplicatedOperation.complexity})\n`;
        }
    } else {
        message += 'No complicated operations yet!\n';
    }

    return message;
}

function getHelpMessage() {
    return `
🔢 Welcome to the Counting Game! 🔢

Rules:
1. Count up from 1, one number at a time.
2. Base 10.
3. NO BOTS ALLOWED!!!
4. Each person can only count once in a row.
5. If someone makes a mistake, the count continues without resetting.

You can use basic math operations to represent numbers:
• Addition: 2+3
• Subtraction: 10-7
• Multiplication: 4*3
• Division: 15/3
• Exponents: 2^3
• Square roots and cube roots: √9 or sqrt(9), cbrt(27)

Commands:
• !stats - View game statistics
• !help - Show this help message

Have fun counting! 🎉
    `;
}

module.exports = {getStatsMessage, getHelpMessage};
