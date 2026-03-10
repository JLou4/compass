const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🧭 Running Compass database migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../src/lib/migrations.sql'), 
      'utf8'
    );
    
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await sql(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();