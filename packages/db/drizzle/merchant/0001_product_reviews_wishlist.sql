CREATE TABLE IF NOT EXISTS "product_reviews" (
  "id" serial PRIMARY KEY NOT NULL,
  "store_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "buyer_id" integer NOT NULL,
  "rating" smallint NOT NULL,
  "comment" text,
  "status" varchar(20) DEFAULT 'approved' NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "product_reviews_buyer_id_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."buyers"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "product_reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5),
  CONSTRAINT "uq_product_reviews_store_product_buyer" UNIQUE("store_id","product_id","buyer_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_reviews_store_product_status" ON "product_reviews" USING btree ("store_id","product_id","status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wishlist_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "store_id" integer NOT NULL,
  "buyer_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "wishlist_items_buyer_id_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."buyers"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "wishlist_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "uq_wishlist_items_store_buyer_product" UNIQUE("store_id","buyer_id","product_id")
);
