import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection({
    host: "ytcreator-ai-server.mysql.database.azure.com",
    port: 3306,
    database: "sowork_db",
    user: "lahbqgrqit",
    password: "SoWork2026db!",
    ssl: { rejectUnauthorized: false },
  });
  
  const [tables] = await conn.execute("SHOW TABLES");
  console.log("Tables:", JSON.stringify(tables, null, 2));
  
  await conn.end();
}

main().catch(console.error);
