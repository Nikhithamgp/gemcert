"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { FieldError } from "@/components/ui";
import { CARD_COLORS } from "@/lib/card-colors";
import {
  TREATMENT_SUGGESTIONS,
  certificateDraftSchema,
  draftFromFormData,
  fieldErrors as toFieldErrors,
  type FieldErrors,
} from "@/lib/validation/certificate";
import { saveDraftAction, type FormState } from "./actions";

type Values = Record<string, string>;

const MAX_MB = 8;

function CardColorField({ value, error }: { value: string; error?: string[] }) {
  const [selected, setSelected] = useState(value);
  // Keep in sync when the server returns new values (e.g. after a failed save).
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setSelected(value);
  }
  const color = CARD_COLORS.find((c) => c.value === selected);
  return (
    <div className="sm:w-1/2">
      <label htmlFor="cardColor" className="label">
        Card colour
      </label>
      <div className="flex items-center gap-3">
        <select
          id="cardColor"
          name="cardColor"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="input"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "cardColor-error" : "cardColor-hint"}
        >
          <option value="">Shop default</option>
          {CARD_COLORS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {color && (
          <span
            aria-hidden
            title={color.label}
            className="h-9 w-9 shrink-0 rounded-md border border-border"
            style={{ background: color.bg }}
          />
        )}
      </div>
      {!error && (
        <p id="cardColor-hint" className="mt-1 text-xs text-muted">
          Colour of the top band on the printed card.
        </p>
      )}
      <FieldError id="cardColor-error" errors={error} />
    </div>
  );
}
const ACCEPT = "image/jpeg,image/png,image/webp";

export function CertificateForm({
  id,
  initial,
  currentImageUrl,
  cancelHref,
}: {
  id?: string;
  initial?: Values;
  currentImageUrl?: string | null;
  cancelHref: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveDraftAction, {});
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // React resets the form (including the file input) after the action runs, so
  // drop the stale preview whenever a new server result arrives.
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    setPreview(null);
  }

  const values: Values = state.values ?? initial ?? {};
  const errors: FieldErrors = { ...state.fieldErrors, ...clientErrors };

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(null);
    setClientErrors(({ image: _image, ...rest }) => rest);
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      setClientErrors((c) => ({ ...c, image: ["Please choose a JPEG, PNG or WebP image."] }));
      e.target.value = "";
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setClientErrors((c) => ({ ...c, image: [`Image is too large. Maximum size is ${MAX_MB} MB.`] }));
      e.target.value = "";
      return;
    }
    setRemoveImage(false);
    setPreview(URL.createObjectURL(file));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = certificateDraftSchema.safeParse(draftFromFormData(new FormData(e.currentTarget)));
    const imageError = clientErrors.image;
    if (!parsed.success) {
      e.preventDefault();
      setClientErrors({ ...toFieldErrors(parsed.error), ...(imageError ? { image: imageError } : {}) });
      return;
    }
    if (imageError) {
      e.preventDefault();
      return;
    }
    setClientErrors({});
  }

  const shownImage = preview ?? (removeImage ? null : currentImageUrl);

  const field = (name: string, label: string, opts: { unit?: string; hint?: string; required?: boolean; list?: string; inputMode?: "decimal" | "text"; placeholder?: string } = {}) => (
    <div>
      <label htmlFor={name} className="label">
        {label}
        {opts.unit && <span className="ml-1 font-normal text-muted">({opts.unit})</span>}
        {opts.required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={values[name] ?? ""}
        key={`${name}:${values[name] ?? ""}`}
        className="input"
        required={opts.required}
        inputMode={opts.inputMode}
        list={opts.list}
        placeholder={opts.placeholder}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `${name}-error` : opts.hint ? `${name}-hint` : undefined}
      />
      {opts.hint && !errors[name] && (
        <p id={`${name}-hint`} className="mt-1 text-xs text-muted">
          {opts.hint}
        </p>
      )}
      <FieldError id={`${name}-error`} errors={errors[name]} />
    </div>
  );

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-8" noValidate>
      {id && <input type="hidden" name="id" value={id} />}
      {(state.error || Object.keys(clientErrors).length > 0) && (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          {state.error ?? "Please correct the highlighted fields."}
        </p>
      )}

      <section className="card p-6">
        <h2 className="mb-4 font-semibold">Identification</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("specimenName", "Specimen / gemstone name", {
            required: true,
            placeholder: "e.g. Natural Yellow Sapphire",
            hint: "Enter exactly what the laboratory has identified. The software does not verify this.",
          })}
          {field("weightCt", "Weight", { unit: "ct", required: true, inputMode: "decimal", placeholder: "e.g. 2.45" })}
          {field("colour", "Colour", { placeholder: "e.g. Yellow" })}
          {field("shapeCut", "Shape & cut", { placeholder: "e.g. Oval, mixed cut" })}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-1 font-semibold">Measured properties</h2>
        <p className="mb-4 text-sm text-muted">Leave blank anything that was not measured. Ranges are allowed, e.g. 1.762-1.770.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {field("hardness", "Hardness", { unit: "Mohs", inputMode: "decimal", placeholder: "e.g. 9" })}
          {field("specificGravity", "Specific gravity", { inputMode: "decimal", placeholder: "e.g. 3.99-4.01" })}
          {field("refractiveIndex", "Refractive index", { placeholder: "e.g. 1.762-1.770 or OTL" })}
          {field("lengthMm", "Length", { unit: "mm", inputMode: "decimal" })}
          {field("widthMm", "Width", { unit: "mm", inputMode: "decimal" })}
          {field("depthMm", "Depth", { unit: "mm", inputMode: "decimal" })}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-semibold">Origin, treatment &amp; comments</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("origin", "Origin", { hint: "Only if the laboratory has actually established it. Leave blank otherwise." })}
          {field("treatment", "Treatment", { list: "treatment-options", hint: "Choose “Not tested” or “Undetermined” where applicable." })}
        </div>
        <datalist id="treatment-options">
          {TREATMENT_SUGGESTIONS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="comments" className="label">
              Comments / identification notes <span className="font-normal text-muted">(printed &amp; public)</span>
            </label>
            <textarea
              id="comments"
              name="comments"
              rows={3}
              defaultValue={values.comments ?? ""}
              key={`comments:${values.comments ?? ""}`}
              className="input"
              aria-invalid={errors.comments ? true : undefined}
            />
            <FieldError id="comments-error" errors={errors.comments} />
          </div>
          <div>
            <label htmlFor="internalNotes" className="label">
              Internal notes <span className="font-normal text-muted">(private — never shown publicly)</span>
            </label>
            <textarea
              id="internalNotes"
              name="internalNotes"
              rows={2}
              defaultValue={values.internalNotes ?? ""}
              key={`internalNotes:${values.internalNotes ?? ""}`}
              className="input"
            />
            <FieldError id="internalNotes-error" errors={errors.internalNotes} />
          </div>
          <div className="sm:w-1/2">
            <label htmlFor="printFormat" className="label">
              Preferred print format
            </label>
            <select
              id="printFormat"
              name="printFormat"
              defaultValue={values.printFormat ?? ""}
              key={`printFormat:${values.printFormat ?? ""}`}
              className="input"
            >
              <option value="">Lab default</option>
              <option value="CARD">Card</option>
              <option value="A4">A4 paper</option>
            </select>
          </div>
          <CardColorField value={values.cardColor ?? ""} error={errors.cardColor} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-semibold">Gemstone photograph</h2>
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="flex h-48 w-48 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-gray-50">
            {shownImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shownImage} alt="Gemstone photo preview" className="h-full w-full object-contain" />
            ) : (
              <span className="px-4 text-center text-sm text-muted">No photo yet</span>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <label htmlFor="image" className="label">
              {currentImageUrl ? "Replace photo" : "Upload photo"}
            </label>
            <input
              ref={fileRef}
              id="image"
              name="image"
              type="file"
              accept={ACCEPT}
              onChange={onFileChange}
              className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-white"
              aria-invalid={errors.image ? true : undefined}
              aria-describedby="image-hint"
            />
            <p id="image-hint" className="text-xs text-muted">
              JPEG, PNG or WebP, up to {MAX_MB} MB. Photos are resized and location/EXIF data is removed. A photo is required to publish.
            </p>
            <FieldError id="image-error" errors={errors.image} />
            {state.error && !preview && (
              <p className="text-xs text-muted">If you had chosen a new photo, please select it again before saving.</p>
            )}
            {currentImageUrl && !preview && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="removeImage"
                  checked={removeImage}
                  onChange={(e) => setRemoveImage(e.target.checked)}
                />
                Remove current photo
              </label>
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save draft"}
        </button>
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
