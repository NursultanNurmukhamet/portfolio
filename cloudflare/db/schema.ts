import {sqliteTable,text,integer,index,primaryKey} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';

export const leads=sqliteTable('leads',{
  id:text('id').primaryKey(),
  fingerprint:text('fingerprint').notNull(),
  payload:text('payload'),
  createdAt:integer('created_at').notNull(),
  expiresAt:integer('expires_at').notNull(),
  status:text('status').notNull().default('pending'),
  attempts:integer('attempts').notNull().default(0),
  nextAttempt:integer('next_attempt').notNull(),
  leaseUntil:integer('lease_until'),
  attemptId:text('attempt_id'),
  lastError:text('last_error'),
  telegramMessageId:integer('telegram_message_id')
},t=>[index('idx_leads_pending').on(t.status,t.nextAttempt),index('idx_leads_expiry').on(t.expiresAt).where(sql`${t.payload} IS NOT NULL`),index('idx_leads_created').on(t.createdAt)]);

export const limits=sqliteTable('lead_limits',{
  scope:text('scope').notNull(),bucket:integer('bucket').notNull(),
  count:integer('count').notNull(),expiresAt:integer('expires_at').notNull()
},t=>[primaryKey({columns:[t.scope,t.bucket]}),index('idx_lead_limits_expiry').on(t.expiresAt)]);
