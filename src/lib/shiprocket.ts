// Shiprocket API service — server-only (uses SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD)
const BASE = "https://apiv2.shiprocket.in/v1/external";

interface TokenCache {
  token:     string;
  expiresAt: number;
}

let cache: TokenCache | null = null;

/** Thrown when SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD are not set. */
export class ShiprocketNotConfigured extends Error {
  constructor() { super("Shiprocket is not configured"); }
}

export async function getToken(): Promise<string> {
  if (cache && Date.now() < cache.expiresAt - 5 * 60 * 1000) return cache.token;
  if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) throw new ShiprocketNotConfigured();

  const res = await fetch(`${BASE}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email:    process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!res.ok) throw new Error(`Shiprocket auth failed: ${await res.text()}`);

  const data = await res.json() as { token: string };
  cache = { token: data.token, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
  return data.token;
}

export interface ShiprocketOrderInput {
  order_id:        string;
  order_date:      string; // "YYYY-MM-DD HH:mm"
  pickup_location: string;
  channel_id?:     string;

  billing_customer_name: string;
  billing_last_name?:    string;
  billing_address:       string;
  billing_city:          string;
  billing_pincode:       string;
  billing_state:         string;
  billing_country:       string;
  billing_email:         string;
  billing_phone:         string;

  shipping_is_billing: boolean;

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
  order_id:      number;
  shipment_id:   number;
  status:        string;
  awb_code?:     string;
  courier_name?: string;
  tracking_url?: string;
}

export async function createOrder(input: ShiprocketOrderInput): Promise<ShiprocketOrderResponse> {
  const token = await getToken();
  const res   = await fetch(`${BASE}/orders/create/adhoc`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
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

export interface CourierRate {
  courier_name:            string;
  courier_company_id:      number;
  rate:                    number; // what Shiprocket charges you (₹)
  estimated_delivery_days: number;
  is_surface:              boolean;
  cod:                     boolean;
}

export async function getRates(params: {
  pickup_postcode:   string;
  delivery_postcode: string;
  weight:            number; // kg
  cod?:              0 | 1;
}): Promise<CourierRate[]> {
  const token = await getToken();
  const q = new URLSearchParams({
    pickup_postcode:   params.pickup_postcode,
    delivery_postcode: params.delivery_postcode,
    weight:            String(params.weight),
    cod:               String(params.cod ?? 0),
  });
  const res  = await fetch(`${BASE}/courier/serviceability/?${q}`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  const data = await res.json() as { data?: { available_courier_companies?: CourierRate[] } };
  if (!res.ok) throw new Error(`Shiprocket getRates failed: ${JSON.stringify(data)}`);
  return data.data?.available_courier_companies ?? [];
}

export interface Serviceability {
  serviceable:    boolean;
  rate:           number | null; // cheapest courier, ₹
  courier_name:   string | null;
  delivery_days:  number | null;
}

/**
 * Can a parcel go from `pickup` to `delivery`, and what does the cheapest
 * courier charge? "Not serviceable" is a normal answer (serviceable: false);
 * login or network problems throw so the caller never mistakes them for it.
 */
export async function checkServiceability(params: {
  pickup_postcode:   string;
  delivery_postcode: string;
  weight:            number; // kg
}): Promise<Serviceability> {
  const none: Serviceability = { serviceable: false, rate: null, courier_name: null, delivery_days: null };
  const token = await getToken();
  const q = new URLSearchParams({
    pickup_postcode:   params.pickup_postcode,
    delivery_postcode: params.delivery_postcode,
    weight:            String(params.weight),
    cod:               "0",
  });
  const res = await fetch(`${BASE}/courier/serviceability/?${q}`, {
    headers: { "Authorization": `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) { cache = null; throw new Error("Shiprocket rejected the login"); }
  if (res.status >= 500) throw new Error(`Shiprocket is unavailable (${res.status})`);

  const data = await res.json().catch(() => null) as {
    data?: { available_courier_companies?: Array<Record<string, unknown>> };
  } | null;
  // Shiprocket answers 404 / an empty list when no courier covers the pincode
  const couriers = data?.data?.available_courier_companies ?? [];
  const priced = couriers
    .map(c => ({
      rate: Number(c.rate ?? c.freight_charge),
      name: typeof c.courier_name === "string" ? c.courier_name : null,
      days: parseInt(String(c.estimated_delivery_days ?? ""), 10),
    }))
    .filter(c => Number.isFinite(c.rate) && c.rate > 0)
    .sort((a, b) => a.rate - b.rate);
  if (!priced.length) return none;

  const best = priced[0];
  return {
    serviceable:   true,
    rate:          best.rate,
    courier_name:  best.name,
    delivery_days: Number.isFinite(best.days) ? best.days : null,
  };
}

export interface PostcodeDetails {
  postcode:   string;
  city:       string;
  state:      string;
  localities: string[];
}

/** City, state and localities for an Indian pincode, or null when Shiprocket doesn't know it. */
export async function postcodeDetails(postcode: string): Promise<PostcodeDetails | null> {
  const token = await getToken();
  const res = await fetch(`${BASE}/open/postcode/details?postcode=${encodeURIComponent(postcode)}`, {
    headers: { "Authorization": `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) { cache = null; throw new Error("Shiprocket rejected the login"); }
  const data = await res.json().catch(() => null) as {
    success?: boolean;
    postcode_details?: { postcode?: string; city?: string; state?: string; locality?: string[] };
  } | null;
  const d = data?.postcode_details;
  if (!data?.success || !d?.city || !d?.state) return null;
  return { postcode, city: d.city, state: d.state, localities: Array.isArray(d.locality) ? d.locality : [] };
}
