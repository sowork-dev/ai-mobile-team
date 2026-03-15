import mysql from 'mysql2/promise';
const conn = await mysql.createConnection({
  host: 'ytcreator-ai-server.mysql.database.azure.com',
  port: 3306,
  database: 'sowork_db',
  user: 'lahbqgrqit',
  password: 'SoWork2026db'
});

// 查看完整欄位
const [cols] = await conn.execute('DESCRIBE agents');
console.log('All columns:');
cols.forEach(c => console.log(`- ${c.Field} (${c.Type})`));

// 查看範例資料（包含知識庫、方法論、人像）
const [rows] = await conn.execute(`
  SELECT name, avatarUrl, methodology, knowledgeSources 
  FROM agents LIMIT 2
`);
console.log('\nSample data:');
rows.forEach(r => {
  console.log(`\n${r.name}:`);
  console.log(`  avatar: ${r.avatarUrl ? 'YES' : 'NO'}`);
  console.log(`  methodology: ${r.methodology ? r.methodology.substring(0, 50) + '...' : 'NO'}`);
  console.log(`  knowledgeSources: ${r.knowledgeSources ? r.knowledgeSources.substring(0, 50) + '...' : 'NO'}`);
});

await conn.end();
