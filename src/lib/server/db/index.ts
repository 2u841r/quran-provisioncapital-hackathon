import * as schema from './schema';
import { DATABASE_URL } from '$app/env/private';

if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

const isLocal = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

if (isLocal) {
	const { drizzle } = await import('drizzle-orm/postgres-js');
	const { default: postgres } = await import('postgres');
	db = drizzle(postgres(DATABASE_URL), { schema });
} else {
	const { drizzle } = await import('drizzle-orm/neon-http');
	const { neon } = await import('@neondatabase/serverless');
	db = drizzle(neon(DATABASE_URL), { schema });
}

export { db };
