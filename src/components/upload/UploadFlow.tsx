"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  Tag,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Step = "pick" | "edit" | "details" | "done";

const STEP_LABELS: Record<Step, string> = {
  pick: "Choose Media",
  edit: "Edit",
  details: "Details",
  done: "Published",
};

const STEPS: Step[] = ["pick", "edit", "details", "done"];

const FILTERS = [
  { id: "none", label: "Original", style: "" },
  { id: "warm", label: "Warm", style: "sepia(0.3) saturate(1.3)" },
  { id: "cool", label: "Cool", style: "hue-rotate(30deg) saturate(1.2)" },
  { id: "fade", label: "Fade", style: "opacity(0.8) brightness(1.1) contrast(0.9)" },
  { id: "vivid", label: "Vivid", style: "saturate(1.8) contrast(1.1)" },
  { id: "noir", label: "Noir", style: "grayscale(1) contrast(1.2)" },
];

export default function UploadFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pick");
  const [preview, setPreview] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("none");
  const [caption, setCaption] = useState("");
  const [people, setPeople] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const stepIndex = STEPS.indexOf(step);

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setPreview(url);
    setStep("edit");
  }

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }

  const currentFilter = FILTERS.find((f) => f.id === activeFilter)?.style ?? "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          {step !== "pick" && step !== "done" ? (
            <button
              onClick={() => setStep(STEPS[stepIndex - 1])}
              className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="w-8" />
          )}

          <div className="flex items-center gap-1.5">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                    i < stepIndex
                      ? "bg-violet-500 text-white"
                      : i === stepIndex
                      ? "bg-linear-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-purple-200"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i < stepIndex ? <Check size={10} strokeWidth={3} /> : i + 1}
                </div>
                {i < 2 && <div className={`w-8 h-0.5 rounded-full ${i < stepIndex ? "bg-violet-300" : "bg-gray-100"}`} />}
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push("/")}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step title */}
        {step !== "done" && (
          <div className="px-6 pt-5 pb-1">
            <h2 className="text-lg font-bold text-gray-900">{STEP_LABELS[step]}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === "pick" && "Upload from your gallery or take a photo"}
              {step === "edit" && "Apply a filter to your image"}
              {step === "details" && "Add a caption and tag details"}
            </p>
          </div>
        )}

        {/* ── STEP: PICK ── */}
        {step === "pick" && (
          <div className="p-6 space-y-4">
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-violet-100 to-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload size={24} className="text-violet-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700 text-sm">Drag & drop or click to upload</p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, GIF up to 20MB</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm"
            >
              <ImageIcon size={16} />
              Browse Gallery
            </button>

            <button
              onClick={() => {
                setPreview("https://picsum.photos/seed/demo/600/700");
                setStep("edit");
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm"
            >
              <Camera size={16} />
              Use Demo Image
            </button>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFilePick} />
          </div>
        )}

        {/* ── STEP: EDIT ── */}
        {step === "edit" && preview && (
          <div className="p-6 space-y-4">
            {/* Preview */}
            <div className="rounded-2xl overflow-hidden bg-gray-50 aspect-[4/3] relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
                style={{ filter: currentFilter }}
              />
            </div>

            {/* Filter strip */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Filters</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className="flex flex-col items-center gap-1.5 shrink-0"
                  >
                    <div
                      className={`w-14 h-14 rounded-xl overflow-hidden ring-2 transition-all ${
                        activeFilter === f.id
                          ? "ring-violet-500 scale-[1.05]"
                          : "ring-transparent hover:ring-gray-200"
                      }`}
                    >
                      <img
                        src={preview}
                        alt={f.label}
                        className="w-full h-full object-cover"
                        style={{ filter: f.style }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${activeFilter === f.id ? "text-violet-600" : "text-gray-400"}`}>
                      {f.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep("details")}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-linear-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-200 transition-all"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── STEP: DETAILS ── */}
        {step === "details" && (
          <div className="p-6 space-y-4">
            {/* Thumbnail + caption side by side */}
            <div className="flex gap-3">
              {preview && (
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={preview}
                    alt="thumb"
                    className="w-full h-full object-cover"
                    style={{ filter: currentFilter }}
                  />
                </div>
              )}
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={3}
                className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none focus:ring-2 focus:ring-violet-300 transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {["UI/UX", "Branding", "3D", "Motion", "Illustration", "Typography"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      category === c
                        ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag people */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
              <Tag size={15} className="text-gray-400 shrink-0" />
              <input
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                placeholder="Tag people (e.g. @alex_creates)"
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
              <MapPin size={15} className="text-gray-400 shrink-0" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
            </div>

            {/* Publish */}
            <button
              onClick={() => setStep("done")}
              className="w-full py-3.5 bg-linear-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-200 transition-all text-sm"
            >
              Publish to Ortist
            </button>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === "done" && (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-xl shadow-purple-200">
              <Check size={36} strokeWidth={2.5} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Published!</h2>
            <p className="text-gray-400 text-sm mb-8">Your work is now live on Ortist</p>

            {preview && (
              <div className="w-32 h-32 rounded-2xl overflow-hidden mb-8 shadow-lg">
                <img
                  src={preview}
                  alt="Published"
                  className="w-full h-full object-cover"
                  style={{ filter: currentFilter }}
                />
              </div>
            )}

            <button
              onClick={() => router.push("/")}
              className="w-full py-3.5 bg-linear-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-200 transition-all"
            >
              Back to Feed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
