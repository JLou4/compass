import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL!);
// @ts-expect-error — neon/drizzle version mismatch on transaction generics
export const db = drizzle(sql);