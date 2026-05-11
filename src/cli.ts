import { HttpClient } from './http-client';

const main = async () => {
  const baseUrl = 'https://jsonplaceholder.typicode.com';
  const client = new HttpClient(baseUrl);
  const response = await client.get('/todos/1');
  console.log(JSON.stringify(response.data, null, 2));
};

main().catch(console.error);
