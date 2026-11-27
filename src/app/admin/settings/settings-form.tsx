"use client";

import { useActionState } from "react";
import { FieldError } from "@/components/ui";
import { saveSettingsAction, type SettingsState } from "./actions";

type Values = Record<string, string>;

export function SettingsForm({ values, logoUrl, envBaseUrl }: { values: Values; logoUrl: string | null; envBaseUrl: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettingsAction, {});
  const e = state.fieldErrors ?? {};

  const field = (name: string, label: string, opts: { hint?: string; type?: string; placeholder?: string } = {}) => (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={opts.type ?? "text"}
        defaultValue={values[name] ?? ""}
        placeholder={opts.placeholder}
        className={opts.type === "color" ? "h-10 w-20 cursor-pointer rounded border border-border" : "input"}
        aria-invalid={e[name] ? true : undefined}
      />
      {opts.hint && !e[name] && <p className="mt-1 text-xs text-muted">{opts.hint}</p>}
      <FieldError id={`${name}-error`} errors={e[name]} />
    </div>
  );

  return (
    <form action={action} className="space-y-8">
      {state.error && (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Settings saved.
        </p>
      )}

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Laboratory identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("labName", "Laboratory name")}
          {field("tagline", "Tagline", { placeholder: "e.g. Gemmological Testing Laboratory" })}
          {field("addressLine", "Address")}
          {field("phone", "Phone")}
          {field("email", "Email", { type: "email" })}
          {field("website", "Website")}
        </div>
        <div>
          <label htmlFor="logo" className="label">
            Logo
          </label>
          <div className="flex items-center gap-4">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Current logo" className="h-16 w-auto rounded border border-border bg-white p-1" />
            )}
            <input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" />
          </div>
          <p className="mt-1 text-xs text-muted">PNG with transparent background works best. Max 8 MB.</p>
          <FieldError id="logo-error" errors={e.logo} />
          {logoUrl && (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" name="removeLogo" /> Remove logo
            </label>
          )}
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Verification &amp; numbering</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("publicBaseUrl", "Public base URL (encoded in QR codes)", {
            placeholder: envBaseUrl || "https://verify.yourlab.com",
            hint: `Leave blank to use PUBLIC_BASE_URL (${envBaseUrl || "not set"}). Must be https in production. Changing it only affects certificates published afterwards.`,
          })}
          {field("certificatePrefix", "Certificate number prefix", {
            hint: "Numbers look like PREFIX-2026-000001. Changing it never re-uses old numbers.",
          })}
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Card &amp; certificate design</h2>
        <div className="flex flex-wrap gap-6">
          {field("primaryColor", "Primary colour", { type: "color" })}
          {field("accentColor", "Accent colour", { type: "color" })}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {field("cardWidthMm", "Card width (mm)", { hint: "Standard ID card: 85.6" })}
          {field("cardHeightMm", "Card height (mm)", { hint: "Standard ID card: 54" })}
          <div>
            <label htmlFor="defaultPrintFormat" className="label">
              Default print format
            </label>
            <select id="defaultPrintFormat" name="defaultPrintFormat" defaultValue={values.defaultPrintFormat} className="input">
              <option value="CARD">Card</option>
              <option value="A4">A4 paper</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("signatoryName", "Authorised signatory name (optional)", { hint: "Shown with a blank signature line on A4 reports." })}
          {field("signatoryTitle", "Signatory title (optional)")}
        </div>
        {field("cardFooterText", "Card footer text (optional)")}
        <div>
          <label htmlFor="disclaimerText" className="label">
            Disclaimer (A4 report &amp; public page)
          </label>
          <textarea id="disclaimerText" name="disclaimerText" rows={3} defaultValue={values.disclaimerText ?? ""} className="input" />
          <FieldError id="disclaimerText-error" errors={e.disclaimerText} />
        </div>
      </section>

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
