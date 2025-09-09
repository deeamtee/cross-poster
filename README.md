# Cross Poster MVP

A React + TypeScript application for cross-posting content to multiple social media platforms simultaneously.

🚀 **Live Demo**: [https://deeamtee.github.io/cross-poster/](https://deeamtee.github.io/cross-poster/)

## Features

- 📝 Create text posts with optional images
- 📱 Publish to Telegram and VK with one click
- ⚙️ Easy platform configuration
- 📊 Real-time publishing results
- 💾 Persistent settings storage

## Supported Platforms

- **Telegram** - via Bot API
- **VK** - via VK API (text posts)

## Quick Start

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your Firebase configuration values.

3. Start development server:
   ```bash
   pnpm dev
   ```

4. Configure your platforms:
   - Click the "⚙️ Settings" button
   - Add your API credentials
   - Enable the platforms you want to use

## Platform Setup

### Environment Variables

⚠️ **Security Notice**: Never commit your `.env` file to version control. All sensitive data like API keys and tokens are stored in environment variables.

Required environment variables (see `.env.example`):
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain  
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- Other Firebase configuration values

### Telegram
1. Create a bot via [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Add the bot to your channel/group and get the Chat ID

### VK
1. Get an access token from [vkhost.github.io](https://vkhost.github.io/)
2. Ensure permissions: `wall,photos,groups`
3. Get your Group ID or User ID for posting

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Custom CSS
- **APIs**: Native fetch for HTTP requests

## Project Structure

```
src/
├── components/          # React components
│   ├── PostForm.tsx     # Post creation form
│   ├── ConfigForm.tsx   # Platform configuration
│   └── PublishResults.tsx # Results display
├── services/            # API services
│   ├── telegram.ts      # Telegram Bot API
│   ├── vk.ts           # VK API
│   └── index.ts        # Cross-poster coordinator
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component
```

## Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm preview` - Preview production build
- `pnpm deploy` - Deploy to GitHub Pages

## Deployment

The project is automatically deployed to GitHub Pages via GitHub Actions on every push to the `master` branch.

Manual deployment:
```bash
pnpm deploy
```

## License

MIT
