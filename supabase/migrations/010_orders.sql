-- Orders table — stores Razorpay + Shiprocket order data
CREATE TABLE IF NOT EXISTS orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_order_id     TEXT UNIQUE NOT NULL,
  razorpay_payment_id   TEXT,
  buyer_clerk_id        TEXT NOT NULL,
  seller_clerk_id       TEXT,
  post_id               TEXT,
  item_title            TEXT,
  amount_paise          INTEGER NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending',
  -- pending | paid | processing | shipped | delivered | failed | refunded

  -- Shipping address
  shipping_name         TEXT,
  shipping_phone        TEXT,
  shipping_email        TEXT,
  shipping_address      TEXT,
  shipping_city         TEXT,
  shipping_state        TEXT,
  shipping_pincode      TEXT,
  shipping_country      TEXT DEFAULT 'India',

  -- Shiprocket
  shiprocket_order_id   BIGINT,
  shiprocket_shipment_id BIGINT,
  awb_code              TEXT,
  courier_name          TEXT,
  tracking_url          TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at();
