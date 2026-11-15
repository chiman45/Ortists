/**
 * Share a link the same way everywhere on the site:
 * the phone's native share sheet (WhatsApp, Instagram…) when available,
 * otherwise copy the link. Returns "copied" so the caller can show a ✓.
 */
export async function shareLink(opts: { url: string; title: string; text?: string }): Promise<"shared" | "copied" | "cancelled"> {
  try {
    if (navigator.share) {
      await navigator.share({ title: opts.title, text: opts.text ?? opts.title, url: opts.url });
      return "shared";
    }
    await navigator.clipboard.writeText(opts.url);
    return "copied";
  } catch {
    return "cancelled"; // closed the share sheet
  }
}
