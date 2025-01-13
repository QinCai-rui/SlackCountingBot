# Slack Counting Game Bot

A fun and interactive Slack bot that manages a collaborative counting game. Players take turns counting up, using simple numbers or complex mathematical expressions. The bot tracks stats, milestones, and user performance, encouraging friendly competition and mathematical creativity.

## Features

- Start counting from 1
- Support for complex mathematical expressions (addition, subtraction, multiplication, division, exponentiation, square roots, and cube roots)
- User stats tracking (successful counts, accuracy, average complexity)
- Milestones and achievements

## Development

This project is an **actively maintained** (so long as people use it...) fork of [SlackCountingBot](https://github.com/carmex/SlackCountingBot), which was developed as an experiment to test the capabilities of [Cursor](https://www.cursor.so/), an AI-powered coding assistant. However, this fork is independently maintained and includes significant changes to the game logic and features.

## Getting Started

To set up and run the Slack Counting Game Bot, follow these steps:

1. Clone this repository:
   ```bash
   git clone https://github.com/QinCai-rui/SlackCountingBot.git
   cd SlackCountingBot
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Create a Slack App:
   - Go to [Slack API Apps](https://api.slack.com/apps) and create a new app
   - Add the necessary bot scopes (e.g., `chat:write`, `reactions:write`)
   - Install the app to your workspace

4. Set up environment variables:
   - Create a `.env` file in the project root
   - Add the following variables:
     ```bash
     SLACK_BOT_TOKEN=xoxb-your-bot-token
     SLACK_SIGNING_SECRET=your-signing-secret
     COUNTING_GAME_CHANNEL_ID=channel-id
     ```

5. Start the bot:
   ```bash
   bun app.js
   ```

6. Invite the bot to your designated counting channel in Slack.

7. Start counting!

## Game Rules

1. **No Bots:** Only humans can play!
2. **One Number at a Time:** Each person can only count once in a row.
3. **Continuity:** If someone makes a mistake, the count continues without resetting.
4. **Mathematical Expressions:** Users can use basic and complex mathematical operations to represent numbers (e.g., `2+3`, `sqrt(36)`, `2^3`, `cbrt(27)`).

## Commands

- **`/counting-help` or `!help`:** Shows the rules and commands for the game.
- **`/counting-stats` or `!stats`:** Displays current game statistics, such as highest count, total counts, and top counters.
- **`/counting-eval [expression]`:** Evaluates a mathematical expression privately.

## Contributing

We welcome contributions to this project! If you have any ideas or suggestions, please open an issue or submit a pull request.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

This license ensures that the software remains free and open-source. It allows you to use, modify, and distribute the code, but any modifications or larger works based on this project must also be released under the same license.
