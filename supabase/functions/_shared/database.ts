import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

export async function getDbClient(): Promise<Client> {
  const client = new Client({
    hostname: Deno.env.get('DB_HOSTNAME'),
    port: parseInt(Deno.env.get('DB_PORT') || '5432'),
    user: Deno.env.get('DB_USER'),
    password: Deno.env.get('DB_PASSWORD'),
    database: Deno.env.get('DB_NAME'),
    tls: {
      enabled: true,
      enforce: false,
      caCertificates: [],
    },
  });

  await client.connect();
  return client;
}

export async function query<T = unknown>(
  sql: string,
  params?: unknown[]
): Promise<{ rows: T[] }> {
  const client = await getDbClient();

  try {
    const result = await client.queryObject<T>(sql, params);
    return { rows: result.rows };
  } finally {
    await client.end();
  }
}
