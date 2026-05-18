import { pgTable, serial, integer, text, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const bookmark = pgTable(
	'bookmark',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		verseKey: text('verse_key').notNull(),
		collectionName: text('collection_name').notNull().default('Favorites'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [
		unique('bookmark_user_verse_collection').on(t.userId, t.verseKey, t.collectionName),
		index('bookmark_userId_idx').on(t.userId)
	]
);

export const readingHistory = pgTable(
	'reading_history',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		verseKey: text('verse_key').notNull(),
		readAt: timestamp('read_at').defaultNow().notNull()
	},
	(t) => [
		unique('reading_history_user_verse').on(t.userId, t.verseKey),
		index('reading_history_userId_idx').on(t.userId)
	]
);

export const readingGoal = pgTable('reading_goal', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: 'cascade' }),
	// 'time' | 'pages' | 'range'
	type: text('type').notNull(),
	// 'daily' | 'continuous'
	period: text('period').notNull().default('daily'),
	// pages per day (type='pages', period='daily')
	dailyPages: integer('daily_pages'),
	// seconds per day (type='time', period='daily')
	dailySeconds: integer('daily_seconds'),
	// total days for continuous goals
	duration: integer('duration'),
	// range goal: start/end verse key e.g. "2:1", "2:286"
	rangeStart: text('range_start'),
	rangeEnd: text('range_end'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export * from './auth.schema';
