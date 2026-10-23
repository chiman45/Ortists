-- Artist's own price per canvas size (artwork only, before the platform fee
-- and without frame). Keyed "<shape>:<w>x<h>" in inches, e.g.
--   {"square:16x16": 4500, "portrait:12x16": 3800}
-- A size missing from the map is "request a quote" for clients.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS size_prices JSONB NOT NULL DEFAULT '{}'::jsonb;
