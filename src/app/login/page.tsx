import { SignIn } from "@clerk/nextjs";

const ART_IMAGES = [
  "https://picsum.photos/seed/art1/600/600",
  "https://picsum.photos/seed/art2/600/600",
  "https://picsum.photos/seed/art3/600/600",
  "https://picsum.photos/seed/art4/600/600",
  "https://picsum.photos/seed/art5/600/600",
  "https://picsum.photos/seed/art6/600/600",
  "https://picsum.photos/seed/art7/600/600",
  "https://picsum.photos/seed/art8/600/600",
  "https://picsum.photos/seed/art9/600/600",
  "https://picsum.photos/seed/art10/600/600",
  "https://picsum.photos/seed/art11/600/600",
  "https://picsum.photos/seed/art12/600/600",
  "https://picsum.photos/seed/art13/600/600",
  "https://picsum.photos/seed/art14/600/600",
  "https://picsum.photos/seed/art15/600/600",
  "https://picsum.photos/seed/art16/600/600",
];

export default function LoginPage() {
  return (
    <div className="flex" style={{ height: "100dvh", background: "#111111", overflow: "hidden" }}>

      {/* ── Left: Clerk SignIn ── */}
      <div
        className="flex flex-col w-full lg:w-110 shrink-0 items-center justify-center px-6 py-10 overflow-y-auto"
        style={{ background: "#151515" }}
      >
        <SignIn
          routing="hash"
          forceRedirectUrl="/feed"
          signUpForceRedirectUrl="/onboarding"
          appearance={{
            variables: {
              colorPrimary: "#7C5BF5",
              colorBackground: "#151515",
              colorInputBackground: "rgba(255,255,255,0.05)",
              colorInputText: "#ffffff",
              colorText: "#ffffff",
              colorTextSecondary: "rgba(255,255,255,0.45)",
              colorNeutral: "rgba(255,255,255,0.15)",
              borderRadius: "1rem",
              fontFamily: "inherit",
            },
            elements: {
              card: {
                background: "transparent",
                boxShadow: "none",
                border: "none",
                padding: 0,
                width: "100%",
                maxWidth: "360px",
              },
              headerTitle: {
                color: "#ffffff",
                fontSize: "1.75rem",
                fontWeight: "700",
              },
              headerSubtitle: {
                color: "rgba(255,255,255,0.40)",
              },
              socialButtonsBlockButton: {
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#ffffff",
                borderRadius: "1rem",
              },
              dividerLine: {
                background: "rgba(255,255,255,0.10)",
              },
              dividerText: {
                color: "rgba(255,255,255,0.30)",
              },
              formFieldInput: {
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#ffffff",
                borderRadius: "1rem",
              },
              formFieldLabel: {
                color: "rgba(255,255,255,0.50)",
              },
              formButtonPrimary: {
                background: "#ffffff",
                color: "#111111",
                borderRadius: "1rem",
                fontWeight: "600",
                "&:hover": { background: "#e5e5e5" },
              },
              footerActionLink: {
                color: "#9B7CF5",
              },
              identityPreviewText: {
                color: "#ffffff",
              },
              identityPreviewEditButtonIcon: {
                color: "rgba(255,255,255,0.5)",
              },
            },
          }}
        />
      </div>

      {/* ── Right: art grid ── */}
      <div
        className="hidden lg:grid flex-1"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          gap: 3,
          height: "100dvh",
        }}
      >
        {ART_IMAGES.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ))}
      </div>

    </div>
  );
}
