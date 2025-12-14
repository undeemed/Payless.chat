# Payless.ai

A survey-funded AI assistant for VS Code. Get AI help without paying - complete surveys to earn credits that subsidize the backend LLM service.

## Architecture

- **Backend**: Node.js + TypeScript API that owns all LLM API keys
- **Extension**: VS Code extension with ad sidebar and AI chat panel
- **Database**: Supabase (PostgreSQL + Auth with Google OAuth)
- **Web**: Next.js website at [payless.chat](https://payless.chat)

## Project Structure

```
payless.ai/
├── backend/           # Node.js API server
├── extension/         # VS Code extension
├── web/               # Next.js website (for CPX Research surveys)
└── supabase/          # Database migrations
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project with Google OAuth configured
- API keys for OpenAI, Anthropic, and/or Google AI

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migrations in `supabase/migrations/` in order
3. Configure Google OAuth:

**Auth Callback URL:**

```
https://bycsqbjaergjhwzbulaa.supabase.co/auth/v1/callback
```

**Google OAuth Setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the Google+ API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `https://bycsqbjaergjhwzbulaa.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret
7. In Supabase Dashboard → Authentication → Providers → Google:
   - Enable Google provider
   - Paste Client ID and Client Secret

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

### Extension Setup

```bash
cd extension
npm install
npm run compile
# Press F5 in VS Code to launch extension development host
```

## Environment Variables

### Backend

| Variable               | Description                                |
| ---------------------- | ------------------------------------------ |
| `SUPABASE_URL`         | `https://bycsqbjaergjhwzbulaa.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key                  |
| `SUPABASE_JWT_SECRET`  | JWT secret for token verification          |
| `OPENAI_API_KEY`       | OpenAI API key                             |
| `ANTHROPIC_API_KEY`    | Anthropic API key                          |
| `GOOGLE_AI_API_KEY`    | Google AI API key                          |
| `PORT`                 | Server port (default: 3000)                |

### Extension Settings

Configure in VS Code Settings (`Cmd+,` or `Ctrl+,`):

| Setting                       | Description                                      |
| ----------------------------- | ------------------------------------------------ |
| `payless-ai.backendUrl`       | Backend API URL (default: http://localhost:3000) |
| `payless-ai.supabaseUrl`      | `https://bycsqbjaergjhwzbulaa.supabase.co`       |
| `payless-ai.extensionPageUrl` | `https://payless.chat/extension`                 |

## Credit System

Users earn credits by completing surveys in the sidebar. The system is payout-based:

| Metric         | Value           |
| -------------- | --------------- |
| Credits per $1 | **100 credits** |
| Typical survey | 20-100 credits  |
| Survey length  | 2-15 minutes    |

### How Credits Work

1. User opens the extension sidebar (shows available surveys)
2. User clicks a survey and completes it via CPX Research
3. CPX Research sends a postback to our server
4. Credits are added to user's ledger with reason `survey_complete`
5. User spends credits on AI features

### API Endpoints

| Endpoint              | Description                      |
| --------------------- | -------------------------------- |
| `POST /ads/heartbeat` | Called every 30s to earn credits |
| `GET /ads/stats`      | User's ad viewing statistics     |
| `GET /ads/config`     | Credit rate configuration        |

## Supported AI Models

### OpenAI

- GPT-5.1 (default), GPT-5.1 Thinking, GPT-5.1 Instant, GPT-5.1 Codex, GPT-5

### Anthropic

- Claude Opus 4.5, Claude Sonnet 4.5 (default), Claude Haiku 4.5

### Google

- Gemini 3 (default), Gemini 3 Thinking, Gemini 3 Pro, Gemini 2.5 Pro/Flash

## CPX Research Survey Integration

The extension displays CPX Research surveys in the sidebar to fund free AI credits.

### How Surveys Work in the Extension

1. **WebView Display**: The extension embeds `payless.chat/extension`
2. **Survey List**: Frontend fetches available surveys from `/cpx/surveys`
3. **Survey Completion**: User clicks a survey and completes it on CPX Research
4. **Postback**: CPX sends completion data to `/cpx/postback`
5. **Credit Award**: Backend adds credits based on survey payout

### API Endpoints (CPX)

| Endpoint            | Description                        |
| ------------------- | ---------------------------------- |
| `GET /cpx/surveys`  | Fetch available surveys for user   |
| `GET /cpx/postback` | CPX callback when survey completed |
| `GET /cpx/config`   | Survey configuration               |

## Web Frontend

Live at: **[payless.chat](https://payless.chat)**

- Landing page with features and pricing
- `/extension` - Embedded in VS Code sidebar (survey list)
- `/privacy` - Privacy Policy
- `/terms` - Terms of Service

### Deploy to Vercel

```bash
cd /path/to/Payless.ai
npx vercel --prod
```

## How It Works

1. Users sign in via Google OAuth through Supabase
2. Sidebar shows available surveys from CPX Research
3. User completes surveys to earn credits (100 credits/$1)
4. Credits accumulate in user's ledger
5. Users spend credits on AI chat features
6. Backend calls LLM providers using its own API keys

## License

MIT
