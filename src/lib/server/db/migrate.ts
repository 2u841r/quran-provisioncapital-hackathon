import { readFileSync, readdirSync } from 'fs';
import { sql } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
	try {
		for (const line of readFileSync('.env', 'utf8').split('\n')) {
			const idx = line.indexOf('=');
			if (idx === -1 || line.startsWith('#')) continue;
			process.env[line.slice(0, idx).trim()] = line
				.slice(idx + 1)
				.trim()
				.replace(/^["']|["']$/g, '');
		}
	} catch {}
}

const dbUrl = process.env.DATABASE_URL!;
if (!dbUrl) throw new Error('DATABASE_URL not set');

const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
if (isLocal) {
	const { drizzle } = await import('drizzle-orm/postgres-js');
	const { default: postgres } = await import('postgres');
	db = drizzle(postgres(dbUrl));
} else {
	const { drizzle } = await import('drizzle-orm/neon-http');
	const { neon } = await import('@neondatabase/serverless');
	db = drizzle(neon(dbUrl));
}

// Apply all .sql migration files in order, skipping already-existing objects
const files = readdirSync('drizzle')
	.filter((f) => f.endsWith('.sql'))
	.sort();

for (const file of files) {
	const statements = readFileSync(`drizzle/${file}`, 'utf8')
		.split('--> statement-breakpoint')
		.map((s) => s.trim())
		.filter(Boolean);

	let applied = 0;
	let skipped = 0;

	for (const statement of statements) {
		try {
			await db.execute(sql.raw(statement));
			applied++;
		} catch (e: any) {
			const code = e?.cause?.code ?? e?.code ?? '';
			const msg = e?.cause?.message ?? e?.message ?? '';
			if (code === '42P07' || code === '42701' || code === '42703' || msg.includes('already exists') || msg.includes('does not exist')) {
				skipped++;
			} else {
				console.error(`Failed in ${file}:\n${statement}\n`);
				throw e;
			}
		}
	}

	console.log(`${file}: ${applied} applied, ${skipped} skipped`);
}

console.log('Done');
