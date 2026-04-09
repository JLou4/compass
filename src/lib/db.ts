import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Provide a fallback dummy URL during build to prevent build-time crashes when evaluating exports
const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy.tech/dummy?sslmode=require');
// @ts-expect-error - version mismatch between drizzle and neon types
export const db = drizzle(sql);
