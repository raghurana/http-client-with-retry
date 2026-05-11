import { HttpClient } from './http-client';
import type { AxiosError } from 'axios';

const NORMAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 10_000;

const main = async () => {
  const baseUrl = 'https://jsonplaceholder1.typicode.com'; // Butcher this URL to see retries in action (e.g., 'https://jsonplaceholder1.typicode.com')
  const client = new HttpClient(baseUrl, {
    retry: {
      retries: 3,
      shouldResetTimeout: true,
      retryCondition: shouldRetryRequest,
      retryDelay: (retryCount: number) => {
        console.log(`Retrying request... Attempt #${retryCount}`);
        const baseDelay = NORMAL_DELAY_MS * 2 ** (retryCount - 1);
        const jitter = Math.floor(Math.random() * NORMAL_DELAY_MS);
        return Math.min(baseDelay + jitter, MAX_DELAY_MS);
      }
    }
  });
  const { data, error } = await client.get('/todos/1');
  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
};

const shouldRetryRequest = (error: AxiosError) => {
  const status = error.response?.status;
  const method = error.config?.method?.toUpperCase();
  const idempotentMethods = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);
  if (!method || !idempotentMethods.has(method)) return false;
  if (!status) return true;
  return status === 429 || (status >= 500 && status <= 599);
};

main().catch(console.error);
