import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * MA2 — schema greenfield "merchant DB" (1 banco físico por merchant, `atacommerce_<merchant_slug>`).
 * Todas as tabelas de negócio carregam `storeId` (validação em app; FK lógica para
 * `stores.id` no banco **master** — sem FK física entre bancos distintos).
 * Ver docs/specs/merchant-account-architecture-spec.md §4 e db-schema-english.md §4.
 *
 * Substitui, no cutover MA8, o schema PT em `schema/tenant/` (não editado nesta fase).
 */

export const buyers = pgTable(
  'buyers',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    phone: varchar('phone', { length: 20 }),
    cpf: varchar('cpf', { length: 14 }),
    postalCode: varchar('postal_code', { length: 9 }),
    street: varchar('street', { length: 255 }),
    number: varchar('number', { length: 20 }),
    complement: varchar('complement', { length: 100 }),
    district: varchar('district', { length: 100 }),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 2 }),
    active: boolean('active').default(true),
    failedAttempts: integer('failed_attempts').default(0),
    lockedUntil: timestamp('locked_until'),
    lastAccessAt: timestamp('last_access_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    unique('uq_buyers_store_email').on(t.storeId, t.email),
    uniqueIndex('idx_buyers_store_cpf')
      .on(t.storeId, t.cpf)
      .where(sql`cpf is not null`),
  ],
);

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  buyerId: integer('buyer_id')
    .notNull()
    .references(() => buyers.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  channel: varchar('channel', { length: 10 }).default('email'),
  used: boolean('used').default(false),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  order: integer('order').default(0),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  subtitle: varchar('subtitle', { length: 255 }),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  description: text('description'),
  stock: integer('stock'),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const storeSettings = pgTable(
  'store_settings',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id').notNull(),
    key: varchar('key', { length: 100 }).notNull(),
    value: text('value'),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [unique('uq_store_settings_store_key').on(t.storeId, t.key)],
);

export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  subtitle: varchar('subtitle', { length: 500 }),
  image: varchar('image', { length: 500 }).notNull(),
  ctaText: varchar('cta_text', { length: 100 }).default('Ver oferta'),
  ctaUrl: varchar('cta_url', { length: 500 }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  active: boolean('active').default(true),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  buyerId: integer('buyer_id')
    .notNull()
    .references(() => buyers.id),
  shippingName: varchar('shipping_name', { length: 255 }).notNull(),
  shippingEmail: varchar('shipping_email', { length: 255 }).notNull(),
  shippingPhone: varchar('shipping_phone', { length: 20 }),
  shippingCpf: varchar('shipping_cpf', { length: 14 }),
  shippingPostalCode: varchar('shipping_postal_code', { length: 9 }),
  shippingStreet: varchar('shipping_street', { length: 255 }),
  shippingNumber: varchar('shipping_number', { length: 20 }),
  shippingComplement: varchar('shipping_complement', { length: 100 }),
  shippingDistrict: varchar('shipping_district', { length: 100 }),
  shippingCity: varchar('shipping_city', { length: 100 }),
  shippingState: varchar('shipping_state', { length: 2 }),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  shippingFee: numeric('shipping_fee', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('awaiting_payment'),
  paymentMethod: varchar('payment_method', { length: 20 }),
  mpPaymentId: varchar('mp_payment_id', { length: 100 }),
  eventDate: date('event_date'),
  trackingCode: varchar('tracking_code', { length: 100 }),
  shippingService: varchar('shipping_service', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  mpPaymentId: varchar('mp_payment_id', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  statusMp: varchar('status_mp', { length: 30 }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  method: varchar('method', { length: 20 }),
  rawResponse: text('raw_response'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const cartItems = pgTable(
  'cart_items',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id').notNull(),
    buyerId: integer('buyer_id')
      .notNull()
      .references(() => buyers.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [unique('uq_cart_items_buyer_product').on(t.buyerId, t.productId)],
);

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: integer('record_id'),
  action: varchar('action', { length: 10 }).notNull(),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const inventoryMovements = pgTable('inventory_movements', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(),
  quantity: integer('quantity').notNull(),
  source: varchar('source', { length: 30 }),
  sourceId: integer('source_id'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const scheduleConfig = pgTable(
  'schedule_config',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id').notNull(),
    dailyCapacity: integer('daily_capacity').notNull().default(1),
    minLeadDays: integer('min_lead_days').notNull().default(1),
    maxLeadDays: integer('max_lead_days').notNull().default(180),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [unique('uq_schedule_config_store').on(t.storeId)],
);

export const scheduleSpecialDays = pgTable(
  'schedule_special_days',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id').notNull(),
    date: date('date').notNull(),
    capacity: integer('capacity'),
    reason: varchar('reason', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [unique('uq_schedule_special_days_store_date').on(t.storeId, t.date)],
);

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  eventDate: date('event_date').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('confirmed'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatConversations = pgTable('chat_conversations', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  sessionId: text('session_id').notNull(),
  buyerId: integer('buyer_id').references(() => buyers.id, { onDelete: 'set null' }),
  visitorName: varchar('visitor_name', { length: 100 }).default('Visitante'),
  status: varchar('status', { length: 20 }).notNull().default('open'),
  botActive: boolean('bot_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => chatConversations.id, { onDelete: 'cascade' }),
  sender: varchar('sender', { length: 10 }).notNull(),
  content: text('content').notNull(),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatBotReplies = pgTable('chat_bot_replies', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  keyword: varchar('keyword', { length: 200 }).notNull(),
  reply: text('reply').notNull(),
  order: integer('order').default(0),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
