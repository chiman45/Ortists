"use client";

import { Clock, Star } from "lucide-react";
import Link from "next/link";
import { MarketplaceListing } from "@/lib/types";

export default function CommissionCard({ item }: { item: MarketplaceListing }) {
  return (
    <Link href={`/marketplace/${item.id}`} className="block">
      <div
        className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer"
        style={{
          background: "var(--bg-card)",
          border: "1px solid rgba(124,91,245,0.2)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
        }}
      >
        {/* Image */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt={item.title} style={{ width: "100%", display: "block", objectFit: "cover" }} />
          <span
            className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(124,91,245,0.85)", color: "#fff", backdropFilter: "blur(8px)" }}
          >
            Commission Open
          </span>
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.avatar} alt={item.artistName} className="w-5 h-5 rounded-full object-cover" />
            <span className="text-xs" style={{ color: "var(--text-4)" }}>{item.artistName}</span>
            <span className="ml-auto flex items-center gap-0.5 text-[10px]" style={{ color: "#F59E0B" }}>
              <Star size={10} fill="#F59E0B" stroke="none" /> 4.9
            </span>
          </div>
          <p className="text-sm font-semibold mb-2 truncate" style={{ color: "var(--text-1)" }}>{item.title}</p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px]" style={{ color: "var(--text-5)" }}>Starting at </span>
              <span className="text-sm font-bold" style={{ color: "#9B7CF5" }}>${item.price}</span>
            </div>
            <div className="flex items-center gap-1" style={{ color: "var(--text-5)" }}>
              <Clock size={11} />
              <span className="text-[10px]">{item.deliveryTime}</span>
            </div>
          </div>
          <button
            onClick={e => e.preventDefault()}
            className="mt-3 w-full py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: "linear-gradient(135deg, #361E7B, #7C5BF5)" }}
          >
            Request Commission
          </button>
        </div>
      </div>
    </Link>
  );
}
