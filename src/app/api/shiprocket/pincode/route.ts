import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { checkServiceability, postcodeDetails, ShiprocketNotConfigured } from "@/lib/shiprocket";

// GET /api/shiprocket/pincode?pincode=490011
// Asks Shiprocket about one pincode while an address is being typed:
//   - which city and state it belongs to (to fill the form in)
//   - whether couriers collect parcels from there (needed to sell artwork)
export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (me.error) return me.error;

  const pincode = (req.nextUrl.searchParams.get("pincode") ?? "").trim();
  if (!/^\d{6}$/.test(pincode)) return NextResponse.json({ error: "Enter a 6-digit pincode." }, { status: 400 });

  try {
    // "Can a courier pick up here?" is checked by asking for a parcel from this
    // pincode to a big-city pincode that every courier serves.
    const metro = pincode === "110001" ? "400001" : "110001";
    const [details, pickup] = await Promise.all([
      postcodeDetails(pincode),
      checkServiceability({ pickup_postcode: pincode, delivery_postcode: metro, weight: 1 }),
    ]);
    return NextResponse.json({
      pincode,
      found:      !!details,
      city:       details?.city ?? null,
      state:      details?.state ?? null,
      localities: details?.localities ?? [],
      pickup:     pickup.serviceable,
    });
  } catch (e) {
    console.error("[shiprocket/pincode]", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: e instanceof ShiprocketNotConfigured ? "Pincode checks are not set up yet." : "We couldn't check this pincode. Please try again." },
      { status: 503 },
    );
  }
}
