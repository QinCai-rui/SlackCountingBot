require('dotenv').config();

const {App, ExpressReceiver} = require('@slack/bolt');
const math = require('mathjs');
const fs = require('fs').promises;
const path = require('path');
const AsyncLock = require('async-lock');

// Create a custom receiver
const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    // The `processBeforeResponse` option is required for all FaaS environments.
    // It allows Bolt methods to send an acknowledgement back to Slack before the app logic finishes.
    processBeforeResponse: true
});

// Create the Bolt app, using the custom receiver
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver
});

// Handle the challenge request
receiver.router.post('/', (req, res) => {
    if (req.body.type === 'url_verification') {
        res.send(req.body.challenge);
    } else {
        res.sendStatus(404);
    }
});

const STATS_FILE = path.join(__dirname, 'counting_stats.json');

let currentCount = 1;
let lastUser = null;
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

function simplifyExpression(expression) {
    try {
        // Replace √ with sqrt, handling both √n and √(...)
        const preparedExpression = expression
            .replace(/√(\d+)/g, 'sqrt($1)')
            .replace(/√/g, 'sqrt');

        // Parse and simplify the expression
        const simplified = math.simplify(preparedExpression);

        // Convert back to string and replace sqrt with √
        return simplified.toString().replace(/sqrt/g, '√');
    } catch (error) {
        console.error('Error simplifying expression:', error);
        return expression; // Return original expression if simplification fails
    }
}

function calculateComplexity(expression) {
    const operatorCount = (expression.match(/[+\-*/^√]|\bsqrt\b/g) || []).length;
    const uniqueNumbers = new Set(expression.match(/\d+/g) || []);
    const numberCount = uniqueNumbers.size;
    const parenthesesCount = (expression.match(/\(/g) || []).length;
    const factorialGroups = expression.match(/!+/g) || [];
    const factorialComplexity = factorialGroups.reduce((sum, group) => sum + Math.min(group.length, 3), 0);

    if (operatorCount === 0 && numberCount === 1 && parenthesesCount === 0 && factorialComplexity === 0) {
        return 0;
    }

    return operatorCount + numberCount + parenthesesCount + factorialComplexity;
}

function getHelpMessage() {
    return `
*Counting Game Help*
Count by entering the next number in the sequence. You can use basic math operations in your count:

• Addition: 5+3
• Subtraction: 10-4
• Multiplication: 3*4
• Division: 15/3
• Exponents: 2^3
• Square roots: √16, √(25+11), sqrt(16), or sqrt(25+11)
• Factorials: 5! (be careful with large numbers!)

Remember:
1. The result must be the next number in the sequence.
2. You can't count twice in a row.
3. If you make a mistake, the count resets to 1.
4. Factorials grow very quickly, so use them wisely!

Have fun counting!
  `;
}

async function getStatsMessage(client) {
    let statsMessage = `*Counting Game Stats*\n`;
    statsMessage += `Total successful counts: ${stats.totalSuccessfulCounts}\n`;

    if (stats.highestCountTimestamp) {
        const highestCountDate = new Date(stats.highestCountTimestamp);
        statsMessage += `Highest number counted ${stats.highestCount} on ${highestCountDate.toLocaleDateString()} at ${highestCountDate.toLocaleTimeString()}\n`;
    } else {
        statsMessage += `Highest number counted: ${stats.highestCount}\n`;
    }

    if (stats.mostComplicatedOperation && stats.mostComplicatedOperation.user) {
        const userName = await getUserName(client, stats.mostComplicatedOperation.user);
        statsMessage += `Most complicated operation: ${stats.mostComplicatedOperation.expression} by ${userName} (complexity score: ${stats.mostComplicatedOperation.complexity})\n`;
    }

    statsMessage += `\n*Milestones*\n`;
    for (const [milestone, userId] of Object.entries(stats.milestones)) {
        const userName = await getUserName(client, userId);
        statsMessage += `${milestone}: ${userName}\n`;
    }

    statsMessage += `\n*User Stats*\n`;

    const userEntries = Object.entries(stats.userStats);

    if (userEntries.length > 0) {
        const mostActive = userEntries.reduce((a, b) => (a[1].successful + a[1].unsuccessful > b[1].successful + b[1].unsuccessful) ? a : b);
        const mostAccurate = userEntries.reduce((a, b) => {
            const aAccuracy = a[1].successful / (a[1].successful + a[1].unsuccessful) || 0;
            const bAccuracy = b[1].successful / (b[1].successful + b[1].unsuccessful) || 0;
            return aAccuracy > bAccuracy ? a : b;
        });
        const mostComplex = userEntries.reduce((a, b) => {
            const aAvgComplexity = a[1].totalComplexity / a[1].countWithComplexity || 0;
            const bAvgComplexity = b[1].totalComplexity / b[1].countWithComplexity || 0;
            return aAvgComplexity > bAvgComplexity ? a : b;
        });

        const mostActiveName = await getUserName(client, mostActive[0]);
        const mostAccurateName = await getUserName(client, mostAccurate[0]);
        const mostComplexName = await getUserName(client, mostComplex[0]);

        statsMessage += `Most active user: ${mostActiveName}\n`;
        statsMessage += `Most accurate user: ${mostAccurateName}\n`;
        statsMessage += `User with highest average complexity: ${mostComplexName}\n\n`;

        for (const [userId, userStats] of userEntries) {
            const userName = await getUserName(client, userId);
            const total = userStats.successful + userStats.unsuccessful;
            const accuracy = total > 0 ? (userStats.successful / total * 100).toFixed(2) : 0;
            const avgComplexity = userStats.countWithComplexity > 0
                ? (userStats.totalComplexity / userStats.countWithComplexity).toFixed(2)
                : 0;
            statsMessage += `${userName}: ${userStats.successful} successful, ${userStats.unsuccessful} unsuccessful, ${accuracy}% accuracy, avg complexity: ${avgComplexity}`;
            if (userStats.primes) statsMessage += `, ${userStats.primes} primes`;
            if (userStats.perfectSquares) statsMessage += `, ${userStats.perfectSquares} perfect squares`;
            statsMessage += `\n`;
        }
    } else {
        statsMessage += `No user stats available yet.\n`;
    }

    return statsMessage;
}

async function getUserName(client, userId) {
    try {
        const result = await client.users.info({user: userId});
        return result.user.name;
    } catch (error) {
        console.error(`Error fetching user info for ${userId}:`, error);
        return userId; // Fallback to userId if we can't fetch the name
    }
}

const lock = new AsyncLock();
const messageQueue = [];

async function processMessage(message, say, client) {
    if (!/^[\d+\-*/^√().\s!]+$|^.*sqrt\(.*\).*$/.test(message.text)) {
        return;
    }

    let number;
    let expression;
    let complexity;
    try {
        expression = parseExpression(message.text);
        const scope = {factorial: factorial};
        number = Math.round(math.evaluate(expression, scope));

        complexity = calculateComplexity(message.text);

        if (complexity > stats.mostComplicatedOperation.complexity) {
            stats.mostComplicatedOperation = {
                expression: message.text,
                user: message.user,
                complexity: complexity
            };
            await saveStats();
        }

    } catch (error) {
        console.log('Error evaluating expression:', error);
        return;
    }

    if (!stats.userStats[message.user]) {
        stats.userStats[message.user] = {
            successful: 0,
            unsuccessful: 0,
            totalComplexity: 0,
            countWithComplexity: 0
        };
    }

    if (message.user === lastUser) {
        await say(`<@${message.user}> messed up! You can't count twice in a row. The count resets to 1.`);
        currentCount = 1;
        stats.currentCount = 1;
        lastUser = null;
        stats.userStats[message.user].unsuccessful++;
        await client.reactions.add({
            channel: message.channel,
            timestamp: message.ts,
            name: 'x'
        });
        await saveStats();
    } else if (number !== currentCount) {
        await say(`<@${message.user}> messed up! The next number should have been ${currentCount}. The count resets to 1.`);
        currentCount = 1;
        stats.currentCount = 1;
        lastUser = null;
        stats.userStats[message.user].unsuccessful++;
        await client.reactions.add({
            channel: message.channel,
            timestamp: message.ts,
            name: 'x'
        });
        await saveStats();
    } else {
        // Correct count
        try {
            let reactionEmoji;
            if (currentCount === 69) {
                reactionEmoji = 'cancer';
            } else if (currentCount % 100 === 0) {
                reactionEmoji = '💯';
            } else {
                reactionEmoji = 'white_check_mark';
            }

            await client.reactions.add({
                channel: message.channel,
                timestamp: message.ts,
                name: reactionEmoji
            });

            currentCount++;
            stats.currentCount = currentCount;
            lastUser = message.user;
            stats.totalSuccessfulCounts++;
            stats.userStats[message.user].successful++;
            stats.userStats[message.user].totalComplexity += complexity;
            stats.userStats[message.user].countWithComplexity++;
            if (currentCount > stats.highestCount) {
                stats.highestCount = currentCount - 1;
                stats.highestCountTimestamp = new Date().toISOString();
            }

            const specialMilestones = [42, 69, 420, 666];
            if (currentCount % 100 === 0 || specialMilestones.includes(currentCount)) {
                stats.milestones[currentCount] = message.user;
                await say(`🎉 Congratulations <@${message.user}>! You've reached ${currentCount}! 🎉`);
            }

            // Track prime numbers
            if (isPrime(currentCount - 1)) {
                stats.userStats[message.user].primes = (stats.userStats[message.user].primes || 0) + 1;
            }

            // Track perfect squares
            if (Math.sqrt(currentCount - 1) % 1 === 0) {
                stats.userStats[message.user].perfectSquares = (stats.userStats[message.user].perfectSquares || 0) + 1;
            }

            await saveStats();
        } catch (error) {
            console.error(error);
        }
    }
}

app.message(/^(?!!)[^!].*$/, async ({message, say, client}) => {
    if (message.channel !== process.env.COUNTING_GAME_CHANNEL_ID) return;

    messageQueue.push({message, say, client});

    // Process the queue
    lock.acquire('messageProcessing', async (done) => {
        while (messageQueue.length > 0) {
            const {message, say, client} = messageQueue.shift();
            await processMessage(message, say, client);
        }
        done();
    }, (err, ret) => {
        if (err) {
            console.error('Error processing message queue:', err);
        }
    });
});

app.command('/counting-stats', async ({command, ack, say, client}) => {
    await ack();
    const statsMessage = await getStatsMessage(client);
    await say(statsMessage);
});

app.command('/counting-help', async ({command, ack, say}) => {
    await ack();
    await say(getHelpMessage());
});

app.message('!help', async ({message, say}) => {
    if (message.channel === process.env.COUNTING_GAME_CHANNEL_ID) {
        await say(getHelpMessage());
    }
});

app.message('!stats', async ({message, say, client}) => {
    if (message.channel === process.env.COUNTING_GAME_CHANNEL_ID) {
        const statsMessage = await getStatsMessage(client);
        await say(statsMessage);
    }
});

function isPrime(num) {
    for (let i = 2, s = Math.sqrt(num); i <= s; i++) {
        if (num % i === 0) return false;
    }
    return num > 1;
}

function parseExpression(expression) {
    // Replace factorials with a function call
    expression = expression.replace(/(\d+)!/g, 'factorial($1)');
    // Replace √ with sqrt, but handle cases where √ is not followed by parentheses
    expression = expression.replace(/√(\d+)/g, 'sqrt($1)').replace(/√/g, 'sqrt');
    return expression;
}

function factorial(n) {
    if (n === 0 || n === 1) return 1;
    if (n < 0) throw new Error("Factorial is not defined for negative numbers");
    if (!Number.isInteger(n)) throw new Error("Factorial is only defined for integers");
    return n * factorial(n - 1);
}

(async () => {
    await loadStats();
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ Counting game bot is running!');
})();
