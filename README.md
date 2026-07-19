# Ultimate Auto Completer 2.0

A high-performance, modular auto-completer for multiple homework platforms with Bedrock AI integration.

## Features

- **Multi-Platform Support**: Sparx Maths, EducAke, Dr Frost, Seneca, Languagenut
- **Bedrock AI Integration**: Uses AWS Bedrock for intelligent question solving
- **Session Management**: Persistent session handling with recovery
- **Queue System**: BullMQ for reliable task processing
- **Error Handling**: Comprehensive error tracking and recovery
- **Logging**: Structured logging with Pino
- **Discord Integration**: Full Discord.js bot support
- **Plugin Architecture**: Easy to add new platforms

## Project Structure

```
src/
├── bot/              # Discord bot setup and handlers
├── platforms/        # Platform-specific plugins
│   ├── sparxMaths/
│   ├── educake/
│   ├── drfrost/
│   ├── seneca/
│   └── languagenut/
├── ai/               # Bedrock AI integration
├── session/          # Session management
├── queue/            # Task queue management
├── utils/            # Utilities and helpers
└── index.js          # Entry point
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file from `.env.example`
4. Configure your credentials and API keys
5. Start the bot:
   ```bash
   npm start
   ```

## Development

```bash
npm run dev     # Run with nodemon
npm run lint    # Run ESLint
npm test        # Run tests
```

## Architecture

### Plugin System
Each platform is implemented as a plugin inheriting from a base `Platform` class. This allows easy addition of new platforms without modifying core logic.

### Queue System
Uses BullMQ for reliable task processing with built-in retry logic and error handling.

### Session Management
Manages user sessions with automatic recovery and persistence options.

## Configuration

All configuration is done through environment variables. See `.env.example` for all available options.

## License

MIT
