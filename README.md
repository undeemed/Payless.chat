# Payless.ai

An ad-funded AI assistant for VS Code. Get AI help without paying - ads subsidize the backend LLM service.

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
├── web/               # Next.js website (for AdSense approval)
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

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | `https://bycsqbjaergjhwzbulaa.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `SUPABASE_JWT_SECRET` | JWT secret for token verification |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `GOOGLE_AI_API_KEY` | Google AI API key |
| `PORT` | Server port (default: 3000) |

### Extension Settings

Configure in VS Code Settings (`Cmd+,` or `Ctrl+,`):

| Setting | Description |
|---------|-------------|
| `payless-ai.backendUrl` | Backend API URL (default: http://localhost:3000) |
| `payless-ai.supabaseUrl` | `https://bycsqbjaergjhwzbulaa.supabase.co` |
| `payless-ai.extensionPageUrl` | `https://payless.chat/extension` |

## Credit System

Users earn credits by watching ads in the sidebar. The system is time-based:

| Metric | Value |
|--------|-------|
| Earn rate | **10 credits/minute** |
| Per hour | ~600 credits |
| Heartbeat interval | 30 seconds |
| Session timeout | 60 seconds |

### How Credits Work

1. User opens the extension sidebar (shows ads)
2. Extension sends "heartbeat" every 30 seconds while visible
3. Backend awards credits: `credits = (elapsed_seconds / 60) × 10`
4. Credits are added to user's ledger with reason `ad_view`
5. User spends credits on AI features

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /ads/heartbeat` | Called every 30s to earn credits |
| `GET /ads/stats` | User's ad viewing statistics |
| `GET /ads/config` | Credit rate configuration |

## Supported AI Models

### OpenAI
- GPT-5.1 (default), GPT-5.1 Thinking, GPT-5.1 Instant, GPT-5.1 Codex, GPT-5

### Anthropic
- Claude Opus 4.5, Claude Sonnet 4.5 (default), Claude Haiku 4.5

### Google
- Gemini 3 (default), Gemini 3 Thinking, Gemini 3 Pro, Gemini 2.5 Pro/Flash

## Google AdSense Integration

The extension displays Google AdSense ads in the sidebar to fund free AI credits.

**AdSense Publisher ID:** `ca-pub-6034027262191917`

### How AdSense Works in the Extension

1. **WebView Display**: The extension embeds `payless.chat/extension`
2. **Script Loading**: AdSense JavaScript loads from `pagead2.googlesyndication.com`
3. **Ad Rendering**: Google serves contextual/display ads
4. **Revenue**: CPM (impressions) and CPC (clicks) revenue

### Ad Formats for Sidebars

For narrow VS Code sidebars, these formats work best:
- **Responsive Display Ads** (recommended) - automatically adjusts
- **Vertical Banner** (160x600) - fits tall narrow spaces
- **Square** (250x250, 300x250) - works if sidebar is wide enough

## Web Frontend

Live at: **[payless.chat](https://payless.chat)**

- Landing page with features and pricing
- `/extension` - Embedded in VS Code sidebar
- `/privacy` - Privacy Policy
- `/terms` - Terms of Service
- `/ads.txt` - AdSense verification

### Deploy to Vercel

```bash
cd /path/to/Payless.ai
npx vercel --prod
```

## How It Works

1. Users sign in via Google OAuth through Supabase
2. Sidebar shows ads while earning credits (10/min)
3. Credits accumulate in user's ledger
4. Users spend credits on AI chat features
5. Backend calls LLM providers using its own API keys

## License

MIT
