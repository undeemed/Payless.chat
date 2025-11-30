import * as vscode from 'vscode';
import { ApiClient } from '../api/client';
import { SupabaseAuth } from '../auth/supabase';

export class AdsSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'payless-ai.adsView';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly apiClient: ApiClient,
    private readonly supabaseAuth: SupabaseAuth
  ) {}

  private getAdsenseConfig(): { publisherId: string; slotId: string } {
    const config = vscode.workspace.getConfiguration('payless-ai');
    return {
      publisherId: config.get<string>('adsensePublisherId') || '',
      slotId: config.get<string>('adsenseSlotId') || '',
    };
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    // Configure WebView options with CSP for AdSense
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'signIn':
          await vscode.commands.executeCommand('payless-ai.signIn');
          break;
        case 'signOut':
          await vscode.commands.executeCommand('payless-ai.signOut');
          break;
        case 'refresh':
          await this.updateUserData();
          break;
        case 'ready':
          await this.updateUserData();
          break;
        case 'adLoaded':
          console.log('AdSense ad loaded successfully');
          break;
        case 'adError':
          console.error('AdSense error:', message.error);
          break;
      }
    });
  }

  public refresh() {
    if (this._view) {
      this.updateUserData();
    }
  }

  private async updateUserData() {
    if (!this._view) return;

    const isSignedIn = await this.supabaseAuth.isSignedIn();

    if (!isSignedIn) {
      this._view.webview.postMessage({
        type: 'update',
        data: { signedIn: false },
      });
      return;
    }

    try {
      const userData = await this.apiClient.getMe();
      this._view.webview.postMessage({
        type: 'update',
        data: {
          signedIn: true,
          user: {
            email: userData.email,
            displayName: userData.display_name,
            avatarUrl: userData.avatar_url,
          },
          credits: userData.credit_balance,
        },
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      this._view.webview.postMessage({
        type: 'error',
        message: 'Failed to fetch user data',
      });
    }
  }

  private getHtmlContent(webview: vscode.Webview): string {
    const adsenseConfig = this.getAdsenseConfig();
    const hasAdsense = adsenseConfig.publisherId && adsenseConfig.slotId;

    // Generate a nonce for inline scripts
    const nonce = getNonce();

    // Content Security Policy that allows Google AdSense
    // AdSense requires: pagead2.googlesyndication.com, googleads.g.doubleclick.net, etc.
    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}' https://pagead2.googlesyndication.com https://www.googletagservices.com https://partner.googleadservices.com https://tpc.googlesyndication.com`,
      `frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com`,
      `img-src ${webview.cspSource} https: data:`,
      `connect-src https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net`,
      `font-src ${webview.cspSource}`,
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>Payless AI</title>
  ${hasAdsense ? `
  <!-- Google AdSense -->
  <script nonce="${nonce}" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseConfig.publisherId}" crossorigin="anonymous"></script>
  ` : ''}
  <style>
    :root {
      --bg-primary: var(--vscode-sideBar-background);
      --bg-secondary: var(--vscode-editor-background);
      --text-primary: var(--vscode-foreground);
      --text-secondary: var(--vscode-descriptionForeground);
      --accent: #6366f1;
      --accent-light: #818cf8;
      --accent-dark: #4f46e5;
      --success: #10b981;
      --warning: #f59e0b;
      --border: var(--vscode-panel-border);
      --card-bg: var(--vscode-editor-background);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--text-primary);
      background: var(--bg-primary);
      padding: 12px;
      min-height: 100vh;
    }

    .container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }

    .logo {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    }

    .brand {
      flex: 1;
    }

    .brand-name {
      font-weight: 600;
      font-size: 14px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .brand-tagline {
      font-size: 11px;
      color: var(--text-secondary);
    }

    /* Credit Card */
    .credit-card {
      background: linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 50%, var(--accent-light) 100%);
      border-radius: 12px;
      padding: 20px;
      color: white;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.25);
    }

    .credit-card::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    .credit-card::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -30%;
      width: 60%;
      height: 60%;
      background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .credit-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.9;
      margin-bottom: 4px;
    }

    .credit-amount {
      font-size: 32px;
      font-weight: 700;
      display: flex;
      align-items: baseline;
      gap: 4px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .credit-amount .unit {
      font-size: 14px;
      font-weight: 400;
      opacity: 0.8;
    }

    .credit-status {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      font-size: 11px;
      opacity: 0.9;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--success);
      animation: pulse 2s infinite;
      box-shadow: 0 0 8px var(--success);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.9); }
    }

    /* User Section */
    .user-section {
      background: var(--card-bg);
      border-radius: 8px;
      padding: 12px;
      border: 1px solid var(--border);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
    }

    .avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-details {
      flex: 1;
      min-width: 0;
    }

    .user-name {
      font-weight: 500;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 11px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Buttons */
    .btn {
      width: 100%;
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .btn-secondary {
      background: transparent;
      color: var(--text-primary);
      border: 1px solid var(--border);
    }

    .btn-secondary:hover {
      background: var(--bg-secondary);
      border-color: var(--accent);
    }

    .btn-icon {
      width: 16px;
      height: 16px;
    }

    /* Ad Container */
    .ad-container {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 12px;
      border: 1px solid var(--border);
      text-align: center;
      overflow: hidden;
    }

    .ad-wrapper {
      min-height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(129, 140, 248, 0.05) 100%);
      border-radius: 8px;
      position: relative;
    }

    /* AdSense responsive ad unit */
    .adsbygoogle {
      display: block;
      width: 100%;
      min-height: 100px;
    }

    .ad-placeholder {
      padding: 30px 16px;
      color: var(--text-secondary);
      font-size: 11px;
    }

    .ad-placeholder-icon {
      width: 32px;
      height: 32px;
      margin: 0 auto 8px;
      opacity: 0.5;
    }

    .ad-label {
      font-size: 9px;
      color: var(--text-muted, var(--text-secondary));
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.6;
    }

    .ad-funding-note {
      font-size: 10px;
      color: var(--text-secondary);
      margin-top: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .ad-funding-note svg {
      width: 12px;
      height: 12px;
      color: var(--success);
    }

    /* Signed Out State */
    .signed-out {
      text-align: center;
      padding: 24px 16px;
    }

    .signed-out-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
      border-radius: 16px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
    }

    .signed-out h3 {
      font-size: 16px;
      margin-bottom: 8px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .signed-out p {
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 16px;
      line-height: 1.5;
    }

    /* Loading */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Footer */
    .footer {
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid var(--border);
      font-size: 10px;
      color: var(--text-secondary);
      text-align: center;
    }

    .hidden {
      display: none !important;
    }

    /* Ad loading skeleton */
    .ad-skeleton {
      background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--card-bg) 50%, var(--bg-secondary) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      height: 100px;
      border-radius: 4px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">P</div>
      <div class="brand">
        <div class="brand-name">Payless AI</div>
        <div class="brand-tagline">Free AI, powered by ads</div>
      </div>
    </div>

    <!-- Loading State -->
    <div id="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- Signed Out State -->
    <div id="signedOut" class="signed-out hidden">
      <div class="signed-out-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <h3>Welcome to Payless AI</h3>
      <p>Sign in with Google to get free AI credits. Watch ads to fund your AI usage!</p>
      <button class="btn btn-primary" onclick="signIn()">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
      </button>
    </div>

    <!-- Signed In State -->
    <div id="signedIn" class="hidden">
      <div class="credit-card">
        <div class="credit-label">Available Credits</div>
        <div class="credit-amount">
          <span id="creditAmount">0</span>
          <span class="unit">credits</span>
        </div>
        <div class="credit-status">
          <span class="status-dot"></span>
          <span>Connected to backend</span>
        </div>
      </div>

      <div class="user-section">
        <div class="user-info">
          <div class="avatar" id="avatar">?</div>
          <div class="user-details">
            <div class="user-name" id="userName">User</div>
            <div class="user-email" id="userEmail">user@example.com</div>
          </div>
        </div>
      </div>

      <button class="btn btn-secondary" onclick="refresh()">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 4v6h-6"/>
          <path d="M1 20v-6h6"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        Refresh Balance
      </button>

      <button class="btn btn-secondary" onclick="signOut()">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Sign Out
      </button>
    </div>

    <!-- Ad Container -->
    <div class="ad-container">
      <div class="ad-wrapper" id="adWrapper">
        ${hasAdsense ? `
        <!-- Google AdSense Ad Unit -->
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="${adsenseConfig.publisherId}"
             data-ad-slot="${adsenseConfig.slotId}"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        ` : `
        <!-- Placeholder when AdSense is not configured -->
        <div class="ad-placeholder" id="adPlaceholder">
          <svg class="ad-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <div>Ad Space</div>
          <div style="margin-top: 4px; font-size: 9px; opacity: 0.7;">Configure AdSense in settings</div>
        </div>
        `}
      </div>
      <div class="ad-label">Sponsored</div>
      <div class="ad-funding-note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        Ads fund your free AI credits
      </div>
    </div>

    <div class="footer">
      Helping developers code smarter, for free
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const hasAdsense = ${hasAdsense};

    function signIn() {
      vscode.postMessage({ command: 'signIn' });
    }

    function signOut() {
      vscode.postMessage({ command: 'signOut' });
    }

    function refresh() {
      vscode.postMessage({ command: 'refresh' });
    }

    function updateUI(data) {
      document.getElementById('loading').classList.add('hidden');

      if (!data.signedIn) {
        document.getElementById('signedOut').classList.remove('hidden');
        document.getElementById('signedIn').classList.add('hidden');
        return;
      }

      document.getElementById('signedOut').classList.add('hidden');
      document.getElementById('signedIn').classList.remove('hidden');

      // Update credits with animation
      const creditEl = document.getElementById('creditAmount');
      const newCredits = data.credits || 0;
      animateNumber(creditEl, parseInt(creditEl.textContent) || 0, newCredits);

      // Update user info
      if (data.user) {
        const displayName = data.user.displayName || data.user.email?.split('@')[0] || 'User';
        document.getElementById('userName').textContent = displayName;
        document.getElementById('userEmail').textContent = data.user.email || '';

        const avatarEl = document.getElementById('avatar');
        if (data.user.avatarUrl) {
          avatarEl.innerHTML = '<img src="' + data.user.avatarUrl + '" alt="Avatar">';
        } else {
          avatarEl.textContent = displayName.charAt(0).toUpperCase();
        }
      }
    }

    function animateNumber(el, from, to) {
      const duration = 500;
      const start = performance.now();

      function update(time) {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(from + (to - from) * eased);
        el.textContent = current.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      requestAnimationFrame(update);
    }

    // Initialize AdSense ads
    function initAds() {
      if (hasAdsense && typeof adsbygoogle !== 'undefined') {
        try {
          (adsbygoogle = window.adsbygoogle || []).push({});
          vscode.postMessage({ command: 'adLoaded' });
        } catch (e) {
          console.error('AdSense initialization error:', e);
          vscode.postMessage({ command: 'adError', error: e.message });
        }
      }
    }

    // Handle messages from extension
    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.type) {
        case 'update':
          updateUI(message.data);
          break;
        case 'error':
          console.error('Error:', message.message);
          break;
      }
    });

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      // Small delay to ensure AdSense script is loaded
      if (hasAdsense) {
        setTimeout(initAds, 100);
      }
    });

    // Notify extension that webview is ready
    vscode.postMessage({ command: 'ready' });
  </script>
</body>
</html>`;
  }
}

// Generate a random nonce for CSP
function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
