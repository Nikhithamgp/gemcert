"use client";

import { useActionState, useState } from "react";
import { duplicateAction, publishAction, reviseAction, voidAction, type FormState } from "../actions";

function ErrorText({ state }: { state: FormState }) {
  if (!state.error) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-danger">
      {state.error}
    </p>
  );
}

export function PublishButton({ id, disabledReason }: { id: string; disabledReason?: string }) {
  const [state, action, pending] = useActionState(publishAction.bind(null, id), {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Publish this certificate? A permanent number and QR code will be issued and the data can no longer be edited.")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="btn-primary w-full" disabled={pending || Boolean(disabledReason)}>
        {pending ? "Publishing…" : "Publish & issue number"}
      </button>
      {disabledReason && <p className="mt-2 text-xs text-muted">{disabledReason}</p>}
      <ErrorText state={state} />
    </form>
  );
}

export function SimpleActionButton({ id, kind }: { id: string; kind: "duplicate" | "revise" }) {
  const fn = kind === "duplicate" ? duplicateAction : reviseAction;
  const [state, action, pending] = useActionState(fn.bind(null, id), {});
  return (
    <form action={action}>
      <button type="submit" className="btn-secondary w-full" disabled={pending}>
        {pending ? "Working…" : kind === "duplicate" ? "Duplicate as new draft" : "Create revision (correction)"}
      </button>
      <ErrorText state={state} />
    </form>
  );
}

export function VoidForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(voidAction.bind(null, id), {});
  if (!open) {
    return (
      <button type="button" className="btn-secondary w-full border-red-300 text-danger" onClick={() => setOpen(true)}>
        Void certificate…
      </button>
    );
  }
  return (
    <form action={action} className="space-y-2 rounded-md border border-red-300 bg-red-50 p-3">
      <label htmlFor="reason" className="label text-red-900">
        Reason for voiding (internal)
      </label>
      <textarea id="reason" name="reason" rows={3} required minLength={5} maxLength={500} className="input" />
      <p className="text-xs text-red-900">
        Anyone scanning this QR code will see <strong>VOIDED</strong>. This cannot be undone.
      </p>
      <div className="flex gap-2">
        <button type="submit" className="btn-danger" disabled={pending}>
          {pending ? "Voiding…" : "Confirm void"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      <ErrorText state={state} />
    </form>
  );
}
