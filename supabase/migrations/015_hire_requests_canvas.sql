-- Structured canvas size + framing choice on commission requests.
-- The hire form also writes these into project_description as text, so older
-- rows simply have NULLs here.
ALTER TABLE hire_requests
  ADD COLUMN IF NOT EXISTS canvas_width_in  NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS canvas_height_in NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS with_frame       BOOLEAN,            -- NULL = no size chosen; true/false = client's framing choice
  ADD COLUMN IF NOT EXISTS frame_price      NUMERIC(10,2);      -- floating-frame price quoted at request time (₹), NULL when no frame
