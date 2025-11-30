import * as vscode from 'vscode';
import { ApiClient, HeartbeatResponse } from '../api/client';

const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds

export class AdsSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'payless-ai.adsView';
  private _view?: vscode.WebviewView;
  private _heartbeatInterval?: NodeJS.Timeout;
  private _isVisible = false;
  private _lastHeartbeatResponse?: HeartbeatResponse;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly apiClient: ApiClient
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getHtmlContent();

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'ready':
          // Page loaded, send initial data
          await this.sendHeartbeat();
          break;
        case 'requestBalance':
          await this.sendHeartbeat();
          break;
      }
    });

    // Track visibility
    webviewView.onDidChangeVisibility(() => {
      this._isVisible = webviewView.visible;
      if (this._isVisible) {
        this.startHeartbeat();
      } else {
        this.stopHeartbeat();
      }
    });

    // Start heartbeat if visible
    this._isVisible = webviewView.visible;
    if (this._isVisible) {
      this.startHeartbeat();
    }

    // Cleanup on dispose
    webviewView.onDidDispose(() => {
      this.stopHeartbeat();
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing interval
    
    // Send initial heartbeat
    this.sendHeartbeat();

    // Set up periodic heartbeats
    this._heartbeatInterval = setInterval(() => {
      if (this._isVisible) {
        this.sendHeartbeat();
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = undefined;
    }
  }

  private async sendHeartbeat() {
    try {
      const token = await this.apiClient.getToken();
      if (!token) {
        // Not signed in, send zero balance
        this.updateWebviewBalance(0, 0, false);
        return;
      }

      const response = await this.apiClient.sendHeartbeat();
      this._lastHeartbeatResponse = response;
      this.updateWebviewBalance(
        response.total_credits,
        response.credits_per_minute,
        true
      );
    } catch (error) {
      console.error('Heartbeat error:', error);
      // On error, try to get cached balance
      if (this._lastHeartbeatResponse) {
        this.updateWebviewBalance(
          this._lastHeartbeatResponse.total_credits,
          this._lastHeartbeatResponse.credits_per_minute,
          false
        );
      }
    }
  }

  private updateWebviewBalance(credits: number, creditsPerMinute: number, isEarning: boolean) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'balanceUpdate',
        credits,
        creditsPerMinute,
        isEarning,
      });
    }
  }

  public refresh() {
    if (this._view) {
      this._view.webview.html = this.getHtmlContent();
    }
  }

  public getLastBalance(): number {
    return this._lastHeartbeatResponse?.total_credits ?? 0;
  }

  private getHtmlContent(): string {
    // Get the extension page URL from settings or use default
    const config = vscode.workspace.getConfiguration('payless-ai');
    const extensionPageUrl = config.get<string>('extensionPageUrl') || 'https://payless.chat/extension';

    // Generate a nonce for security
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en" style="height: 100%; margin: 0; padding: 0;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${extensionPageUrl.split('/').slice(0, 3).join('/')}; script-src 'nonce-${nonce}';">
  <title>Payless AI</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      height: 100%;
      overflow: hidden;
      background: #1e1e1e;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <iframe 
    id="extension-frame"
    src="${extensionPageUrl}" 
    allow="autoplay; encrypted-media"
  ></iframe>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const iframe = document.getElementById('extension-frame');

    // Notify extension that we're ready
    vscode.postMessage({ type: 'ready' });

    // Forward balance updates to iframe
    window.addEventListener('message', (event) => {
      // Handle messages from VS Code extension
      if (event.data && event.data.type === 'balanceUpdate') {
        // Forward to iframe
        iframe.contentWindow.postMessage(event.data, '*');
      }
    });

    // Handle messages from iframe requesting balance
    window.addEventListener('message', (event) => {
      if (event.source === iframe.contentWindow && event.data && event.data.type === 'requestBalance') {
        vscode.postMessage({ type: 'requestBalance' });
      }
    });
  </script>
</body>
</html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
