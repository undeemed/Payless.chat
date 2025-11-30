# Payless.ai

An ad-funded AI assistant for VS Code. Get AI help without paying - ads subsidize the backend LLM service.

## Architecture

- **Backend**: Node.js + TypeScript API that owns all LLM API keys
- **Extension**: VS Code extension with ad sidebar and AI chat panel
- **Database**: Supabase (PostgreSQL + Auth with Google OAuth)

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
| `SUPABASE_URL` | Your Supabase project URL |
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
| `payless-ai.supabaseUrl` | Your Supabase project URL for auth |
| `payless-ai.adsensePublisherId` | Google AdSense Publisher ID (e.g., `ca-pub-1234567890`) |
| `payless-ai.adsenseSlotId` | AdSense Ad Slot ID for the sidebar |

## Google AdSense Integration

The extension displays Google AdSense ads in the sidebar to fund free AI credits for users.

### How AdSense Works in the Extension

1. **WebView Display**: Ads are rendered in a VS Code WebView (sidebar panel)
2. **Script Loading**: The AdSense JavaScript loads from `pagead2.googlesyndication.com`
3. **Ad Rendering**: Google serves contextual/display ads based on your ad unit configuration
4. **Revenue**: You earn CPM (cost per 1000 impressions) and CPC (cost per click) revenue

### Setting Up AdSense

1. **Create AdSense Account**: Go to [Google AdSense](https://www.google.com/adsense) and apply
2. **Get Approved**: Google will review your site/app (this can take days)
3. **Create Ad Unit**:
   - Go to AdSense Dashboard → Ads → By ad unit
   - Create a "Display ads" unit
   - Choose "Responsive" format (works best in narrow sidebars)
   - Copy your Publisher ID (`ca-pub-XXXXXXXXXX`)
   - Copy your Ad Slot ID (numeric)
4. **Configure Extension**:
   ```json
   {
     "payless-ai.adsensePublisherId": "ca-pub-1234567890123456",
     "payless-ai.adsenseSlotId": "1234567890"
   }
   ```

### Ad Formats for Sidebars

For narrow VS Code sidebars, these formats work best:
- **Responsive Display Ads** (recommended) - automatically adjusts
- **Vertical Banner** (160x600) - fits tall narrow spaces
- **Square** (250x250, 300x250) - works if sidebar is wide enough

### Testing Ads

- Ads only show in production (not in development mode)
- Use AdSense preview tool to test ad rendering
- Never click your own ads (violates AdSense policy)

## Web Frontend Deployment

The `web/` directory contains a Next.js website that you need to deploy to get Google AdSense approval.

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Set the root directory to `web/`
4. Deploy!

### Deploy to Netlify

```bash
cd web
npm run build
# Upload the `out/` folder to Netlify
```

### After Deployment

1. **Get your URL**: e.g., `https://payless-ai.vercel.app`
2. **Apply for AdSense**: Go to [google.com/adsense](https://www.google.com/adsense)
3. **Enter your website URL** when prompted
4. **Wait for approval**: Usually 1-14 days
5. **Get your Publisher ID**: Format `ca-pub-XXXXXXXXXXXXXXXX`
6. **Update the code**:
   - In `web/src/app/layout.tsx`: Replace the AdSense script client ID
   - In `web/src/components/AdBanner.tsx`: Replace `data-ad-client` and `data-ad-slot`
   - In `extension/` settings: Add your Publisher ID and Slot ID

## How It Works

1. Users sign in via Google OAuth through Supabase
2. Ads displayed in the VS Code sidebar generate revenue
3. Revenue is converted to credits and allocated to users
4. Users spend credits to use AI features
5. The backend calls LLM providers using its own API keys

## License

MIT

