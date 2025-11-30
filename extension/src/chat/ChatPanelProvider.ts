import * as vscode from 'vscode';
import { ApiClient } from '../api/client';

export class ChatPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'payless-ai.chatView';
  private _view?: vscode.WebviewView;

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
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent();

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'sendMessage':
          await this.handleSendMessage(message.data);
          break;
        case 'getModels':
          await this.handleGetModels();
          break;
        case 'ready':
          await this.handleGetModels();
          break;
      }
    });
  }

  public refresh() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'refresh' });
    }
  }

  private async handleGetModels() {
    if (!this._view) return;

    try {
      const models = await this.apiClient.getModels();
      this._view.webview.postMessage({
        type: 'models',
        data: models.providers,
      });
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  }

  private async handleSendMessage(data: { provider: string; model: string; prompt: string; systemPrompt?: string }) {
    if (!this._view) return;

    try {
      // First estimate the cost
      const estimate = await this.apiClient.estimate({
        provider: data.provider,
        model: data.model,
        prompt: data.prompt,
      });

      this._view.webview.postMessage({
        type: 'estimating',
        data: { estimated_credits: estimate.estimated_credits },
      });

      // Execute the request
      const response = await this.apiClient.execute({
        provider: data.provider,
        model: data.model,
        prompt: data.prompt,
        system_prompt: data.systemPrompt,
      });

      this._view.webview.postMessage({
        type: 'response',
        data: {
          content: response.response,
          credits_spent: response.credits_spent,
          tokens_input: response.tokens_input,
          tokens_output: response.tokens_output,
          model: response.model,
          provider: response.provider,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this._view.webview.postMessage({
        type: 'error',
        message: errorMessage,
      });
    }
  }

  private getHtmlContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payless AI Chat</title>
  <style>
    :root {
      --bg-primary: var(--vscode-panel-background);
      --bg-secondary: var(--vscode-editor-background);
      --bg-input: var(--vscode-input-background);
      --text-primary: var(--vscode-foreground);
      --text-secondary: var(--vscode-descriptionForeground);
      --text-muted: var(--vscode-disabledForeground);
      --accent: #6366f1;
      --accent-light: #818cf8;
      --accent-dark: #4f46e5;
      --border: var(--vscode-panel-border);
      --user-bg: var(--accent);
      --assistant-bg: var(--vscode-editor-background);
      --error: #ef4444;
      --success: #10b981;
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
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .header-title {
      font-weight: 600;
      font-size: 13px;
      margin-right: auto;
    }

    select {
      background: var(--bg-input);
      color: var(--text-primary);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 11px;
      cursor: pointer;
      outline: none;
    }

    select:focus {
      border-color: var(--accent);
    }

    /* Messages Container */
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      display: flex;
      gap: 12px;
      max-width: 100%;
    }

    .message.user {
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .message.user .message-avatar {
      background: var(--user-bg);
      color: white;
    }

    .message.assistant .message-avatar {
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
      color: white;
    }

    .message-content {
      flex: 1;
      min-width: 0;
    }

    .message-bubble {
      padding: 10px 14px;
      border-radius: 12px;
      line-height: 1.5;
      font-size: 13px;
      word-wrap: break-word;
      white-space: pre-wrap;
    }

    .message.user .message-bubble {
      background: var(--user-bg);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message.assistant .message-bubble {
      background: var(--assistant-bg);
      border: 1px solid var(--border);
      border-bottom-left-radius: 4px;
    }

    .message-meta {
      display: flex;
      gap: 8px;
      margin-top: 4px;
      font-size: 10px;
      color: var(--text-muted);
    }

    .message.user .message-meta {
      justify-content: flex-end;
    }

    /* Code blocks in messages */
    .message-bubble pre {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      padding: 8px 12px;
      overflow-x: auto;
      margin: 8px 0;
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
    }

    .message-bubble code {
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
    }

    /* Loading indicator */
    .loading-indicator {
      display: flex;
      gap: 4px;
      padding: 8px;
    }

    .loading-dot {
      width: 6px;
      height: 6px;
      background: var(--accent);
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }

    .loading-dot:nth-child(1) { animation-delay: -0.32s; }
    .loading-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    /* Empty state */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      text-align: center;
      color: var(--text-secondary);
    }

    .empty-state-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      font-size: 14px;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .empty-state p {
      font-size: 12px;
      line-height: 1.5;
    }

    /* Input Area */
    .input-area {
      padding: 12px 16px;
      border-top: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .input-container {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
    }

    textarea {
      width: 100%;
      min-height: 40px;
      max-height: 150px;
      padding: 10px 12px;
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-primary);
      font-family: var(--vscode-font-family);
      font-size: 13px;
      resize: none;
      outline: none;
      line-height: 1.4;
    }

    textarea:focus {
      border-color: var(--accent);
    }

    textarea::placeholder {
      color: var(--text-muted);
    }

    .send-btn {
      width: 40px;
      height: 40px;
      background: var(--accent);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      flex-shrink: 0;
    }

    .send-btn:hover {
      background: var(--accent-dark);
    }

    .send-btn:disabled {
      background: var(--text-muted);
      cursor: not-allowed;
    }

    .send-btn svg {
      width: 18px;
      height: 18px;
      color: white;
    }

    /* Error message */
    .error-toast {
      position: fixed;
      bottom: 80px;
      left: 16px;
      right: 16px;
      background: var(--error);
      color: white;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      animation: slideUp 0.3s ease;
      z-index: 100;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .hidden {
      display: none !important;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="header-title">AI Chat</span>
    <select id="providerSelect">
      <option value="openai">OpenAI</option>
      <option value="anthropic">Anthropic</option>
      <option value="gemini">Gemini</option>
    </select>
    <select id="modelSelect">
      <option value="gpt-4o-mini">GPT-4o Mini</option>
    </select>
  </div>

  <div class="messages" id="messages">
    <div class="empty-state" id="emptyState">
      <div class="empty-state-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <h3>Start a conversation</h3>
      <p>Ask me anything! I can help with coding, explain concepts, review code, and more.</p>
    </div>
  </div>

  <div class="input-area">
    <div class="input-container">
      <div class="input-wrapper">
        <textarea
          id="messageInput"
          placeholder="Ask me anything..."
          rows="1"
        ></textarea>
      </div>
      <button class="send-btn" id="sendBtn" title="Send message">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    // State
    let models = {};
    let isLoading = false;

    // Elements
    const messagesEl = document.getElementById('messages');
    const emptyStateEl = document.getElementById('emptyState');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const providerSelect = document.getElementById('providerSelect');
    const modelSelect = document.getElementById('modelSelect');

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
    });

    // Send on Enter (Shift+Enter for newline)
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Send button click
    sendBtn.addEventListener('click', sendMessage);

    // Provider change
    providerSelect.addEventListener('change', updateModelOptions);

    function updateModelOptions() {
      const provider = providerSelect.value;
      const providerModels = models[provider] || [];

      modelSelect.innerHTML = '';
      providerModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = formatModelName(model);
        modelSelect.appendChild(option);
      });
    }

    function formatModelName(model) {
      return model
        .replace(/-/g, ' ')
        .replace(/\\d{8}/, '')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    function sendMessage() {
      const prompt = messageInput.value.trim();
      if (!prompt || isLoading) return;

      const provider = providerSelect.value;
      const model = modelSelect.value;

      // Add user message to UI
      addMessage('user', prompt);

      // Clear input
      messageInput.value = '';
      messageInput.style.height = 'auto';

      // Show loading
      isLoading = true;
      sendBtn.disabled = true;
      const loadingEl = addLoadingIndicator();

      // Send to backend
      vscode.postMessage({
        command: 'sendMessage',
        data: { provider, model, prompt }
      });
    }

    function addMessage(role, content, meta = {}) {
      emptyStateEl.classList.add('hidden');

      const messageEl = document.createElement('div');
      messageEl.className = 'message ' + role;

      const avatar = role === 'user' ? 'U' : 'AI';

      let metaHtml = '';
      if (meta.model) {
        metaHtml += '<span>' + meta.model + '</span>';
      }
      if (meta.credits_spent !== undefined) {
        metaHtml += '<span>' + meta.credits_spent + ' credits</span>';
      }
      if (meta.tokens) {
        metaHtml += '<span>' + meta.tokens + ' tokens</span>';
      }

      messageEl.innerHTML = \`
        <div class="message-avatar">\${avatar}</div>
        <div class="message-content">
          <div class="message-bubble">\${escapeHtml(content)}</div>
          \${metaHtml ? '<div class="message-meta">' + metaHtml + '</div>' : ''}
        </div>
      \`;

      messagesEl.appendChild(messageEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      return messageEl;
    }

    function addLoadingIndicator() {
      const el = document.createElement('div');
      el.className = 'message assistant';
      el.id = 'loadingMessage';
      el.innerHTML = \`
        <div class="message-avatar">AI</div>
        <div class="message-content">
          <div class="loading-indicator">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </div>
        </div>
      \`;
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return el;
    }

    function removeLoadingIndicator() {
      const el = document.getElementById('loadingMessage');
      if (el) el.remove();
    }

    function showError(message) {
      const toast = document.createElement('div');
      toast.className = 'error-toast';
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => toast.remove(), 5000);
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Handle messages from extension
    window.addEventListener('message', (event) => {
      const message = event.data;

      switch (message.type) {
        case 'models':
          models = message.data;
          updateModelOptions();
          break;

        case 'response':
          removeLoadingIndicator();
          isLoading = false;
          sendBtn.disabled = false;

          addMessage('assistant', message.data.content, {
            model: message.data.model,
            credits_spent: message.data.credits_spent,
            tokens: message.data.tokens_input + message.data.tokens_output
          });
          break;

        case 'error':
          removeLoadingIndicator();
          isLoading = false;
          sendBtn.disabled = false;
          showError(message.message);
          break;

        case 'refresh':
          // Could refresh state here if needed
          break;
      }
    });

    // Initialize
    vscode.postMessage({ command: 'ready' });
  </script>
</body>
</html>`;
  }
}

