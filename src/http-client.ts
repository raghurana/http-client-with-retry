import axios, { type AxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import axiosRetry, { type IAxiosRetryConfig } from 'axios-retry';
import http from 'node:http';
import https from 'node:https';
import { tryCatch } from './try-catch';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpHeaders = Record<string, any>;

export type HttpRequest<TReqBody = void> = {
  method: HttpMethod;
  url: string;
  headers?: HttpHeaders;
  params?: Record<string, unknown>;
  body?: TReqBody;
};

export type HttpResponse<TResBody = unknown, TError = Error> = {
  status: number;
  headers: HttpHeaders;
  data?: TResBody;
  error?: TError;
};

export class HttpClient {
  private readonly axiosInstance: AxiosInstance;

  constructor(baseURL: string, options?: { caCertificates?: string[]; retry?: boolean | IAxiosRetryConfig }) {
    const httpsAgentOptions = options?.caCertificates?.length ? { ca: options.caCertificates, rejectUnauthorized: false } : undefined;
    const agentConfig = baseURL.includes('https:') ? { httpsAgent: new https.Agent(httpsAgentOptions) } : { httpAgent: new http.Agent() };
    this.axiosInstance = axios.create({ baseURL, ...agentConfig });
    if (options?.retry) axiosRetry(this.axiosInstance, typeof options.retry === 'object' ? options.retry : undefined);
  }

  get<Res = unknown>(url: string, queryParams?: Record<string, unknown>, headers?: HttpHeaders): Promise<HttpResponse<Res>> {
    if (headers && 'content-type' in headers) delete headers['content-type'];
    return this.request<undefined, Res>({
      method: 'GET',
      url,
      ...(queryParams ? { params: queryParams } : {}),
      ...(headers ? { headers } : {})
    });
  }

  post<Req = unknown, Res = unknown>(url: string, body?: Req, headers?: HttpHeaders): Promise<HttpResponse<Res>> {
    return this.request<Req, Res>({
      method: 'POST',
      url,
      ...(body !== undefined ? { body } : {}),
      ...(headers ? { headers } : {})
    });
  }

  put<Req = unknown, Res = unknown>(url: string, body?: Req, headers?: HttpHeaders): Promise<HttpResponse<Res>> {
    return this.request<Req, Res>({
      method: 'PUT',
      url,
      ...(body !== undefined ? { body } : {}),
      ...(headers ? { headers } : {})
    });
  }

  patch<Req = unknown, Res = unknown>(url: string, body?: Req, headers?: HttpHeaders): Promise<HttpResponse<Res>> {
    return this.request<Req, Res>({
      method: 'PATCH',
      url,
      ...(body !== undefined ? { body } : {}),
      ...(headers ? { headers } : {})
    });
  }

  delete<Req = unknown, Res = unknown>(url: string, body?: Req, headers?: HttpHeaders): Promise<HttpResponse<Res>> {
    return this.request<Req, Res>({
      method: 'DELETE',
      url,
      ...(body !== undefined ? { body } : {}),
      ...(headers ? { headers } : {})
    });
  }

  private async request<Req = unknown, Res = unknown>(config: HttpRequest<Req>): Promise<HttpResponse<Res>> {
    const { method, url, headers, params, body: data } = config;

    if (headers && 'content-length' in headers) delete headers['content-length'];
    if (headers && 'host' in headers) delete headers['host'];

    const axiosRequestConfig = {
      method,
      url,
      ...(params ? { params } : {}),
      ...(data !== undefined ? { data } : {}),
      ...(headers ? { headers } : {})
    };

    const { data: axiosResponse, error: axiosError } = await tryCatch<AxiosResponse<Res>, AxiosError<Res>>(
      this.axiosInstance.request<Res>(axiosRequestConfig)
    );

    if (axiosError) {
      return {
        status: axiosError.response?.status ?? 500,
        headers: (axiosError.response?.headers as Record<string, string>) || {},
        error: axiosError as Error
      };
    }

    return {
      status: axiosResponse.status,
      headers: axiosResponse.headers as Record<string, string>,
      data: axiosResponse.data as Res
    };
  }
}
