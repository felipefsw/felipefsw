/**
 * Cliente MySQL do rederwp (somente leitura/sync).
 * Removido após Fase 11. Não use em hot path da UI de diaristas.
 *
 * Env:
 *   REDERWP_DB_HOST, REDERWP_DB_PORT, REDERWP_DB_USER, REDERWP_DB_PASSWORD, REDERWP_DB_NAME
 */

export type RederwpRow = Record<string, unknown>;

export function rederwpConfigurado(): boolean {
  return Boolean(process.env.REDERWP_DB_HOST && process.env.REDERWP_DB_USER && process.env.REDERWP_DB_NAME);
}

export async function comRederwp<T>(fn: (query: QueryFn) => Promise<T>): Promise<T> {
  if (!rederwpConfigurado()) {
    throw new Error(
      "MySQL do rederwp não configurado. Defina REDERWP_DB_HOST, REDERWP_DB_USER, REDERWP_DB_PASSWORD, REDERWP_DB_NAME.",
    );
  }
  // Import dinâmico: mysql2 só é necessário nos scripts de sync.
  const mysql = await import("mysql2/promise");
  const conn = await mysql.createConnection({
    host: process.env.REDERWP_DB_HOST,
    port: Number(process.env.REDERWP_DB_PORT || 3306),
    user: process.env.REDERWP_DB_USER,
    password: process.env.REDERWP_DB_PASSWORD || "",
    database: process.env.REDERWP_DB_NAME,
    dateStrings: true,
  });
  try {
    const query: QueryFn = async (sql, params = []) => {
      const [rows] = await conn.query(sql, params);
      return rows as RederwpRow[];
    };
    return await fn(query);
  } finally {
    await conn.end();
  }
}

export type QueryFn = (sql: string, params?: unknown[]) => Promise<RederwpRow[]>;
