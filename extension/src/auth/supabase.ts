import * as vscode from 'vscode';

// Supabase OAuth configuration
const SUPABASE_URL = 'https://your-project.supabase.co'; // Will be configured via settings

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export class SupabaseAuth {
  private static readonly AUTH_CALLBACK_URI = 'vscode://payless-ai.payless-ai/auth-callback';

  constructor(private context: vscode.ExtensionContext) {}

  private getSupabaseUrl(): string {
    // In production, this should come from configuration
    const config = vscode.workspace.getConfiguration('payless-ai');
    return config.get<string>('supabaseUrl') || SUPABASE_URL;
  }

  async signInWithGoogle(): Promise<string | null> {
    const supabaseUrl = this.getSupabaseUrl();

    // Build OAuth URL for Google sign-in
    const authUrl = new URL(`${supabaseUrl}/auth/v1/authorize`);
    authUrl.searchParams.set('provider', 'google');
    authUrl.searchParams.set('redirect_to', SupabaseAuth.AUTH_CALLBACK_URI);

    // Open browser for authentication
    const opened = await vscode.env.openExternal(vscode.Uri.parse(authUrl.toString()));

    if (!opened) {
      vscode.window.showErrorMessage('Failed to open browser for sign-in');
      return null;
    }

    // Wait for callback with token
    // The token will be received via URI handler
    return new Promise((resolve) => {
      // Set a timeout for auth
      const timeout = setTimeout(() => {
        resolve(null);
      }, 120000); // 2 minute timeout

      // Store resolver for URI handler to call
      this.context.globalState.update('authResolver', {
        resolve: (token: string) => {
          clearTimeout(timeout);
          resolve(token);
        },
      });
    });
  }

  async handleAuthCallback(uri: vscode.Uri): Promise<string | null> {
    // Parse the callback URL for tokens
    const fragment = uri.fragment;
    const params = new URLSearchParams(fragment);

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresIn = params.get('expires_in');

    if (!accessToken) {
      // Check for error
      const error = params.get('error_description') || params.get('error');
      if (error) {
        vscode.window.showErrorMessage(`Authentication failed: ${error}`);
      }
      return null;
    }

    // Store tokens
    await this.context.secrets.store('payless-ai.token', accessToken);
    if (refreshToken) {
      await this.context.secrets.store('payless-ai.refreshToken', refreshToken);
    }
    if (expiresIn) {
      const expiresAt = Date.now() + parseInt(expiresIn) * 1000;
      await this.context.globalState.update('payless-ai.tokenExpiresAt', expiresAt);
    }

    return accessToken;
  }

  async getStoredToken(): Promise<string | null> {
    return await this.context.secrets.get('payless-ai.token') || null;
  }

  async signOut(): Promise<void> {
    await this.context.secrets.delete('payless-ai.token');
    await this.context.secrets.delete('payless-ai.refreshToken');
    await this.context.globalState.update('payless-ai.tokenExpiresAt', undefined);
  }

  async isSignedIn(): Promise<boolean> {
    const token = await this.getStoredToken();
    if (!token) return false;

    // Check if token is expired
    const expiresAt = this.context.globalState.get<number>('payless-ai.tokenExpiresAt');
    if (expiresAt && Date.now() > expiresAt) {
      // Token expired, try to refresh
      // For now, just return false - refresh token logic can be added later
      return false;
    }

    return true;
  }
}

