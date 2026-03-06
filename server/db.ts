/**
 * Database connection using mysql2
 */
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "ytcreator-ai-server.mysql.database.azure.com",
  port: parseInt(process.env.DB_PORT || "3306"),
  database: process.env.DB_NAME || "sowork_db",
  user: process.env.DB_USER || "lahbqgrqit",
  password: process.env.DB_PASSWORD || "SoWork2026db",
  waitForConnections: true,
  connectionLimit: 10,
});

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

export default pool;
