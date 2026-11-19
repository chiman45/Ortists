-- Cart + checkout. Safe to run whether or not 010_orders.sql was run before.

-- ── Orders: one row per artwork (each ships separately from its artist) ──
CREATE TABLE IF NOT EXISTS orders (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_order_id      TEXT NOT NULL,
  razorpay_payment_id    TEXT,
  buyer_clerk_id         TEXT NOT NULL,
  seller_clerk_id        TEXT,
  post_id                TEXT,
  item_title             TEXT,
  amount_paise           INTEGER NOT NULL,          -- item + shipping for this row
  status                 TEXT NOT NULL DEFAULT 'pending',
  -- pending | paid | processing | shipped | delivered | failed | refunded

  shipping_name          TEXT,
  shipping_phone         TEXT,
  shipping_email         TEXT,
  shipping_address       TEXT,
  shipping_city          TEXT,
  shipping_state         TEXT,
  shipping_pincode       TEXT,
  shipping_country       TEXT DEFAULT 'India',

  shiprocket_order_id    BIGINT,
  shiprocket_shipment_id BIGINT,
  awb_code               TEXT,
  courier_name           TEXT,
  tracking_url           TEXT,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A cart payment covers several artworks, so one Razorpay order can have many rows.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_razorpay_order_id_key;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS item_paise     INTEGER,
  ADD COLUMN IF NOT EXISTS shipping_paise INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS item_image     TEXT,
  ADD COLUMN IF NOT EXISTS delivery_days  INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS orders_rzp_post_idx ON orders (razorpay_order_id, post_id);
CREATE INDEX IF NOT EXISTS orders_buyer_idx  ON orders (buyer_clerk_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_seller_idx ON orders (seller_clerk_id, created_at DESC);

CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at();

-- Only the server (service role) reads and writes orders.
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ── Cart ──
CREATE TABLE IF NOT EXISTS cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id   TEXT NOT NULL,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clerk_id, post_id)
);

CREATE INDEX IF NOT EXISTS cart_items_clerk_idx ON cart_items (clerk_id, created_at DESC);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
