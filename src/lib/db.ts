import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Provide a fallback dummy URL during build to prevent build-time crashes when evaluating exports
const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy.tech/dummy?sslmode=require');
// @ts-expect-error — neon/drizzle version mismatch on transaction generics
export const db = drizzle(sql);
