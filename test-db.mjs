import pkg from 'pg';
const { Client } = pkg;

const HOST = 'yamanote.proxy.rlwy.net';
const PORT = 59430;
const USER = 'postgres';
const PASSWORD = process.env.PGPASSWORD || 'CertifiveDB2024!';
const DATABASE = 'railway';

console.log('Testing connection to Railway Postgres...\n');

// Test 1: Sin SSL
try {
  const c = new Client({ host: HOST, port: PORT, user: USER, password: PASSWORD, database: DATABASE });
  await c.connect();
  console.log('✅ Conectado SIN SSL');
  await c.end();
} catch(e) {
  console.log('❌ Sin SSL:', e.code, '-', e.message);
}

// Test 2: Con SSL (rejectUnauthorized: false)
try {
  const c = new Client({ host: HOST, port: PORT, user: USER, password: PASSWORD, database: DATABASE, ssl: { rejectUnauthorized: false } });
  await c.connect();
  console.log('✅ Conectado CON SSL (rejectUnauthorized:false)');
  await c.end();
} catch(e) {
  console.log('❌ Con SSL:', e.code, '-', e.message);
}

// Test 3: Con SSL estricto
try {
  const c = new Client({ host: HOST, port: PORT, user: USER, password: PASSWORD, database: DATABASE, ssl: true });
  await c.connect();
  console.log('✅ Conectado CON SSL estricto');
  await c.end();
} catch(e) {
  console.log('❌ Con SSL estricto:', e.code, '-', e.message);
}
