import mysql from 'mysql2/promise';
const conn = await mysql.createConnection({
  host: 'ytcreator-ai-server.mysql.database.azure.com',
  port: 3306,
  database: 'sowork_db',
  user: 'lahbqgrqit',
  password: 'SoWork2026db'
});

// 搜尋 AI、前端、移動端相關人才
const [rows] = await conn.execute(`
  SELECT name, englishName, title, layer, rating
  FROM agents 
  WHERE isAvailable = 1 
    AND (
      title LIKE '%AI%' OR title LIKE '%Machine Learning%' OR
      title LIKE '%Frontend%' OR title LIKE '%前端%' OR
      title LIKE '%Mobile%' OR title LIKE '%iOS%' OR title LIKE '%Android%' OR
      title LIKE '%React%' OR title LIKE '%Swift%'
    )
    AND layer = 'strategy'
  ORDER BY rating DESC
  LIMIT 10
`);

console.log('AI & 前端人才：\n');
rows.forEach((r, i) => {
  console.log(`${i+1}. ${r.name}${r.englishName ? ' / ' + r.englishName : ''}`);
  console.log(`   ${r.title}`);
  console.log('');
});

await conn.end();
