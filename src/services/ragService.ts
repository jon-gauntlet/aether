import { AxiosError } from 'axios';
import api from './api';

export interface QueryRequest {
  question: string;
  context?: Record<string, any>;
}

export interface QueryResponse {
  answer: string;
  sources: Array<{
    content: string;
    metadata: Record<string, any>;
  }>;
}

export interface HealthStatus {
  status: string;
  details?: Record<string, any>;
}

export class RAGService {
  private static instance: RAGService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000';
  }

  public static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  public async query(request: QueryRequest): Promise<QueryResponse> {
    try {
      const response = await api.post<QueryResponse>(
        `${this.baseUrl}/query`,
        request
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`RAG query failed: ${error.response?.data?.detail || error.message}`);
      }
      throw error;
    }
  }

  public async ingestText(text: string, metadata?: Record<string, any>): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/ingest`, { text, metadata });
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Text ingestion failed: ${error.response?.data?.detail || error.message}`);
      }
      throw error;
    }
  }

  public async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await api.get<HealthStatus>(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Health check failed: ${error.response?.data?.detail || error.message}`);
      }
      throw error;
    }
  }
} 