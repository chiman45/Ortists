// Shiprocket API service
// Docs: https://apiv2.shiprocket.in/v1/external

const BASE = "https://apiv2.shiprocket.in/v1/external";

interface TokenCache {
  token: string;
  expiresAt: number; // epoch ms
}

let cache: TokenCache | null = null;

export async function getToken(): Promise<string> {
  // Reuse cached token if still valid (refresh 5 min before expiry)
  if (cache && Date.now() < cache.expiresAt - 5 * 60 * 1000) {
    return cache.token;
  }

  const res = await fetch(`${BASE}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email:    process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shiprocket auth failed: ${err}`);
  }

  const data = await res.json() as { token: string };
  cache = {
    token:     data.token,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 h
  };
  return data.token;
}

export interface ShiprocketOrderInput {
  order_id:        string;  // your unique reference
  order_date:      string;  // "YYYY-MM-DD HH:mm"
  pickup_location: string;  // name of pickup address in Shiprocket dashboard
  channel_id?:     string;

  billing_customer_name:    string;
  billing_last_name?:       string;
  billing_address:          string;
  billing_city:             string;
  billing_pincode:          string;
  billing_state:            string;
  billing_country:          string;
  billing_email:            string;
  billing_phone:            string;

  shipping_is_billing:      boolean;

  order_items: Array<{
    name:          string;
    sku:           string;
    units:         number;
    selling_price: number;
  }>;

  payment_method: "Prepaid" | "COD";
  sub_total:      number;
  length:         number;
  breadth:        number;
  height:         number;
  weight:         number;
}

export interface ShiprocketOrderResponse {
  order_id:    number;
  shipment_id: number;
  status:      string;
  awb_code?:   string;
  courier_name?: string;
  tracking_url?: string;
}

export async function createOrder(input: ShiprocketOrderInput): Promise<ShiprocketOrderResponse> {
  const token = await getToken();
  const res   = await fetch(`${BASE}/orders/create/adhoc`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Shiprocket createOrder failed: ${JSON.stringify(data)}`);
  return data as ShiprocketOrderResponse;
}

export async function trackByShipmentId(shipmentId: string | number): Promise<unknown> {
  const token = await getToken();
  const res   = await fetch(`${BASE}/courier/track/shipment/${shipmentId}`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Shiprocket track failed: ${JSON.stringify(data)}`);
  return data;
}

export async function trackByAwb(awb: string): Promise<unknown> {
  const token = await getToken();
  const res   = await fetch(`${BASE}/courier/track/awb/${awb}`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Shiprocket trackByAwb failed: ${JSON.stringify(data)}`);
  return data;
}
