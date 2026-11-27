/** Rules for the public base URL that gets encoded into QR codes. Pure functions (unit tested). */

export type BaseUrlCheck = {
  /** Normalised origin, e.g. https://verify.example.com */
  url: string | null;
  /** Blocking problems: publishing is refused. */
  errors: string[];
  /** Non-blocking problems shown as a warning banner. */
  warnings: string[];
};

const PRIVATE_HOST =
  /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|\[::1\]|.*\.local|.*\.localhost)$/i;

export function checkPublicBaseUrl(raw: string | null | undefined, production: boolean): BaseUrlCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!raw || !raw.trim()) {
    return {
      url: null,
      errors: ["The public base URL is not configured. Set it in Lab Settings (or PUBLIC_BASE_URL)."],
      warnings,
    };
  }
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return { url: null, errors: [`"${raw}" is not a valid URL.`], warnings };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { url: null, errors: ["The public base URL must start with https://"], warnings };
  }
  if (parsed.pathname !== "/" || parsed.search || parsed.hash || parsed.username || parsed.password) {
    errors.push("The public base URL must be an origin only, e.g. https://verify.yourlab.com (no path or query).");
  }
  const isPrivate = PRIVATE_HOST.test(parsed.hostname);
  const isHttp = parsed.protocol === "http:";

  if (production) {
    if (isHttp) errors.push("In production the public base URL must use https://.");
    if (isPrivate) errors.push(`"${parsed.hostname}" is a local/private address; phones on the internet cannot reach it.`);
  } else {
    if (isPrivate) {
      warnings.push(
        `QR codes currently point to ${parsed.origin}. That only works on this computer or your local network — ` +
          "real customer verification requires deploying to a public https domain.",
      );
    } else if (isHttp) {
      warnings.push("The public base URL uses http://. Use https:// for real certificates.");
    }
  }
  return { url: parsed.origin, errors, warnings };
}

export function buildVerifyUrl(baseOrigin: string, certificateNumber: string): string {
  return `${baseOrigin.replace(/\/$/, "")}/v/${encodeURIComponent(certificateNumber)}`;
}
