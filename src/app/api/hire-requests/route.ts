import { adminDb } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/hire-requests?clientId= | ?artistId=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const artistId = searchParams.get("artistId");

  if (clientId) {
    const { data } = await adminDb
      .from("hire_requests")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    return NextResponse.json({ requests: data ?? [] });
  }

  if (artistId) {
    const { data } = await adminDb
      .from("hire_requests")
      .select("*")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false });
    return NextResponse.json({ requests: data ?? [] });
  }

  return NextResponse.json({ requests: [] });
}

// POST /api/hire-requests — create a hire request + its conversation
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Create a dedicated conversation for this project
  const artistParticipantId = `artist:${body.artist_id}`;
  const { data: conv } = await adminDb
    .from("conversations")
    .insert({ participant_ids: [body.client_id, artistParticipantId] })
    .select()
    .single();

  const defaultMilestones = [
    { id: "1", title: "Project Kickoff",        done: true,  due: null },
    { id: "2", title: "Concept Presentation",   done: false, due: null },
    { id: "3", title: "Concept Approval",       done: false, due: null },
    { id: "4", title: "Final Artwork Delivery", done: false, due: null },
    { id: "5", title: "Client Sign-off",        done: false, due: null },
  ];

  const { data, error } = await adminDb
    .from("hire_requests")
    .insert({
      client_id:           body.client_id,
      artist_id:           body.artist_id,
      artist_name:         body.artist_name,
      artist_avatar:       body.artist_avatar ?? null,
      artist_location:     body.artist_location ?? null,
      artist_rating:       body.artist_rating ?? 5.0,
      project_title:       body.project_title,
      project_description: body.project_description ?? null,
      budget:              body.budget ?? null,
      deadline:            body.deadline ?? null,
      status:              "pending",
      progress:            0,
      phase:               "Kickoff",
      priority:            body.priority ?? "High",
      conversation_id:     conv?.id ?? null,
      milestones:          defaultMilestones,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data });
}
