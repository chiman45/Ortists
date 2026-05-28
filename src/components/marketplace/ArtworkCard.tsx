"use client";

import { Heart, Bookmark } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MarketplaceListing } from "@/lib/types";

export default function ArtworkCard({ item }: { item: MarketplaceListing }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <Link href={`/marketplace/${item.id}`} className="block group">
      <div
        className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
        }}
      >
        {/* Image */}
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.title}
            style={{ width: "100%", display: "block", objectFit: "cover" }}
          />
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={e => { e.preventDefault(); setLiked(v => !v); }}
              className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              <Heart size={14} fill={liked ? "#f43f5e" : "none"} stroke={liked ? "#f43f5e" : "#fff"} />
            </button>
            <button
              onClick={e => { e.preventDefault(); setSaved(v => !v); }}
              className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              <Bookmark size={14} fill={saved ? "#9B7CF5" : "none"} stroke={saved ? "#9B7CF5" : "#fff"} />
            </button>
          </div>
          {/* Physical badge */}
          {item.physical && (
            <span
              className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.65)", color: "#fff", backdropFilter: "blur(8px)" }}
            >
              Physical
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.avatar} alt={item.artistName} className="w-5 h-5 rounded-full object-cover" />
            <span className="text-xs" style={{ color: "var(--text-4)" }}>{item.artistName}</span>
          </div>
          <p className="text-sm font-semibold mb-1 truncate" style={{ color: "var(--text-1)" }}>{item.title}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: "#9B7CF5" }}>${item.price}</span>
            <span className="text-[10px]" style={{ color: "var(--text-5)" }}>{item.medium}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
