require('dotenv').config();

const {App, ExpressReceiver} = require('@slack/bolt');
const {getStatsMessage, getHelpMessage} = require('./utils');
const statsManager = require('./statsManager');
const {processMessage} = require('./gameLogic');
const AsyncLock = require('async-lock');
const { i, detDependencies, efimovFactorDependencies, kron } = require('mathjs');

// Create a custom receiver
const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    processBeforeResponse: true
});

// Create the Bolt app, using the custom receiver
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver
});

// Handle the challenge request (Slack APP verification)
receiver.router.post('/', (req, res) => {
    if (req.body.type === 'url_verification') {
        res.send(req.body.challenge);
    } else {
        res.sendStatus(404);
    }
});

const lock = new AsyncLock();
const messageQueue = [];

// Function to process messages (both regular and !eval)
async function processAndRespond(message, say, client, isEval = false) {
    try {
        const result = await processMessage(message, say, client, isEval);
        if (isEval) {
            // For !eval, we want to return the result explicitly
            if (result) {
                await say(result);
            } else {
                await say("Invalid expression or operation not allowed.");
            }
        }
    } catch (error) {
        console.error('Error processing message:', error);
        if (isEval) {
            await say("An error occurred while processing the expression.");
            await say(error);    // Prints the error in te counting channel
            // TODO: send the error in slack codeblock for better readability
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
            await processAndRespond(message, say, client);
        }
        done();
    }, (err, ret) => {
        if (err) {
            console.error('Error processing message queue:', err);
        }
    });
});

// Add the !eval command
app.message(/^!eval (.+)$/, async ({message, say, client, context}) => {
    if (message.channel !== process.env.COUNTING_GAME_CHANNEL_ID) return;

    const evalExpression = context.matches[1].trim();
    const evalMessage = {...message, text: evalExpression};

    await processAndRespond(evalMessage, say, client, true);
});

app.command('/counting-stats', async ({command, ack, say, client}) => {
    await ack();
    const statsMessage = await getStatsMessage(client, statsManager.getStats());
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
        const statsMessage = await getStatsMessage(client, statsManager.getStats());
        await say(statsMessage);
    }
});

(async () => {
    await statsManager.loadStats();
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ Counting game bot is running!');
})();
