import * as vscode from 'vscode';

export interface MeResponse {
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  credit_balance: number;
}

export interface BalanceResponse {
  credit_balance: number;
}

export interface EstimateRequest {
  provider: string;
  model: string;
  prompt: string;
  max_tokens?: number;
}

export interface EstimateResponse {
  estimated_credits: number;
  provider: string;
  model: string;
}

export interface ExecuteRequest {
  provider: string;
  model: string;
  prompt: string;
  max_tokens?: number;
  system_prompt?: string;
}

export interface ExecuteResponse {
  response: string;
  credits_spent: number;
  tokens_input: number;
  tokens_output: number;
  provider: string;
  model: string;
}

export interface ModelsResponse {
  providers: Record<string, string[]>;
}

export interface HeartbeatResponse {
  credits_earned: number;
  total_credits: number;
  session_seconds: number;
  credits_per_minute: number;
}

export interface AdStatsResponse {
  total_seconds_all_time: number;
  total_credits_earned: number;
  total_seconds_today: number;
  credits_earned_today: number;
  current_balance: number;
  credits_per_minute: number;
}

export interface AdConfigResponse {
  credits_per_minute: number;
  heartbeat_interval_seconds: number;
  session_timeout_seconds: number;
}

export class ApiClient {
  private token: string | null = null;

  constructor(private context: vscode.ExtensionContext) {}

  private getBackendUrl(): string {
    const config = vscode.workspace.getConfiguration('payless-ai');
    return config.get<string>('backendUrl') || 'http://localhost:3000';
  }

  async setToken(token: string): Promise<void> {
    this.token = token;
    await this.context.secrets.store('payless-ai.token', token);
  }

  async getToken(): Promise<string | null> {
    if (this.token) return this.token;
    this.token = await this.context.secrets.get('payless-ai.token') || null;
    return this.token;
  }

  async clearToken(): Promise<void> {
    this.token = null;
    await this.context.secrets.delete('payless-ai.token');
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown
  ): Promise<T> {
    const token = await this.getToken();
    const url = `${this.getBackendUrl()}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // Auth endpoints
  async getMe(): Promise<MeResponse> {
    return this.request<MeResponse>('GET', '/me');
  }

  // Credit endpoints
  async getBalance(): Promise<BalanceResponse> {
    return this.request<BalanceResponse>('GET', '/credits/balance');
  }

  // LLM endpoints
  async getModels(): Promise<ModelsResponse> {
    return this.request<ModelsResponse>('GET', '/llm/models');
  }

  async estimate(request: EstimateRequest): Promise<EstimateResponse> {
    return this.request<EstimateResponse>('POST', '/llm/estimate', request);
  }

  async execute(request: ExecuteRequest): Promise<ExecuteResponse> {
    return this.request<ExecuteResponse>('POST', '/llm/execute', request);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.getBackendUrl()}/health`;
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Ad endpoints
  async sendHeartbeat(): Promise<HeartbeatResponse> {
    return this.request<HeartbeatResponse>('POST', '/ads/heartbeat');
  }

  async getAdStats(): Promise<AdStatsResponse> {
    return this.request<AdStatsResponse>('GET', '/ads/stats');
  }

  async getAdConfig(): Promise<AdConfigResponse> {
    return this.request<AdConfigResponse>('GET', '/ads/config');
  }
}

