const {isPrime} = require('./mathOperations');

async function getStatsMessage(client, stats) {
    let message = '📊 Counting Game Stats 📊\n\n';

    message += `Highest count: ${stats.highestCount}\n`;
    if (stats.highestCountTimestamp) {
        message += `Achieved on: ${new Date(stats.highestCountTimestamp).toLocaleString()}\n`;
    }
    message += `Total successful counts: ${stats.totalSuccessfulCounts}\n\n`;

    message += '🏆 Top Counters:\n';
    const sortedUsers = Object.entries(stats.userStats)
        .sort(([, a], [, b]) => b.successful - a.successful)
        .slice(0, 5);

    for (const [userId, userStats] of sortedUsers) {
        try {
            const userInfo = await client.users.info({user: userId});
            const username = userInfo.user.real_name || userInfo.user.name;
            message += `${username}: ${userStats.successful} (${userStats.unsuccessful} fails)\n`;
        } catch (error) {
            console.error(`Error fetching user info for ${userId}:`, error);
            message += `<@${userId}>: ${userStats.successful} (${userStats.unsuccessful} fails)\n`;
        }
    }

    message += '\n🎯 Milestones:\n';
    for (const [milestone, userId] of Object.entries(stats.milestones)) {
        try {
            const userInfo = await client.users.info({user: userId});
            const username = userInfo.user.real_name || userInfo.user.name;
            message += `${milestone}: ${username}\n`;
        } catch (error) {
            console.error(`Error fetching user info for ${userId}:`, error);
            message += `${milestone}: <@${userId}>\n`;
        }
    }

    message += '\n🧮 Most Complicated Operation:\n';
    if (stats.mostComplicatedOperation.user) {
        try {
            const userInfo = await client.users.info({user: stats.mostComplicatedOperation.user});
            const username = userInfo.user.real_name || userInfo.user.name;
            message += `${username}: ${stats.mostComplicatedOperation.expression} (Complexity: ${stats.mostComplicatedOperation.complexity})\n`;
        } catch (error) {
            console.error(`Error fetching user info for ${stats.mostComplicatedOperation.user}:`, error);
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
2. Each person can only count once in a row.
3. If someone makes a mistake, the count resets to 1.

You can use basic math operations to represent numbers:
• Addition: 2+3
• Subtraction: 10-7
• Multiplication: 4*3
• Division: 15/3
• Exponents: 2^3
• Square roots: √9 or sqrt(9)

Commands:
• !stats - View game statistics
• !help - Show this help message

Have fun counting! 🎉
    `;
}

module.exports = {getStatsMessage, getHelpMessage};
