import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL || 'postgresql://user:password@localhost/compass?sslmode=disable');
// @ts-expect-error - version mismatch between drizzle and neon types
export const db = drizzle(sql);