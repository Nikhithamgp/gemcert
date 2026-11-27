"use client";

import { useActionState } from "react";
import { FieldError } from "@/components/ui";
import { changePasswordAction, createUserAction, updateUserAction, type UserFormState } from "./actions";

function Messages({ state }: { state: UserFormState }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm text-emerald-700">
          {state.ok}
        </p>
      )}
    </>
  );
}

export function CreateUserForm() {
  const [state, action, pending] = useActionState<UserFormState, FormData>(createUserAction, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="font-semibold">Add user</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input id="name" name="name" required className="input" aria-invalid={e.name ? true : undefined} />
          <FieldError id="name-error" errors={e.name} />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required className="input" aria-invalid={e.email ? true : undefined} />
          <FieldError id="email-error" errors={e.email} />
        </div>
        <div>
          <label htmlFor="role" className="label">Role</label>
          <select id="role" name="role" className="input" defaultValue="OPERATOR">
            <option value="OPERATOR">Operator — create & edit drafts, print</option>
            <option value="ADMIN">Admin — also publish, void, settings, users</option>
          </select>
        </div>
        <div>
          <label htmlFor="password" className="label">Temporary password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required className="input" aria-invalid={e.password ? true : undefined} />
          <FieldError id="password-error" errors={e.password} />
        </div>
      </div>
      <Messages state={state} />
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}

export function UserRow({ user, isSelf }: { user: { id: string; name: string; email: string; role: "ADMIN" | "OPERATOR"; active: boolean }; isSelf: boolean }) {
  const [state, action, pending] = useActionState<UserFormState, FormData>(updateUserAction.bind(null, user.id), {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-48 flex-1">
        <div className="font-medium">
          {user.name} {isSelf && <span className="text-xs text-muted">(you)</span>}
        </div>
        <div className="text-sm text-muted">{user.email}</div>
      </div>
      <select name="role" defaultValue={user.role} className="input w-auto" aria-label={`Role for ${user.email}`}>
        <option value="OPERATOR">Operator</option>
        <option value="ADMIN">Admin</option>
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={user.active} /> Active
      </label>
      <button type="submit" className="btn-secondary px-3 py-1" disabled={pending}>
        Save
      </button>
      <div className="w-full">
        <Messages state={state} />
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<UserFormState, FormData>(changePasswordAction, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="card max-w-md space-y-4 p-6">
      <h2 className="font-semibold">Change password</h2>
      {(["currentPassword", "newPassword", "confirmPassword"] as const).map((name) => (
        <div key={name}>
          <label htmlFor={name} className="label">
            {{ currentPassword: "Current password", newPassword: "New password (12+ characters)", confirmPassword: "Confirm new password" }[name]}
          </label>
          <input
            id={name}
            name={name}
            type="password"
            autoComplete={name === "currentPassword" ? "current-password" : "new-password"}
            required
            className="input"
            aria-invalid={e[name] ? true : undefined}
          />
          <FieldError id={`${name}-error`} errors={e[name]} />
        </div>
      ))}
      <Messages state={state} />
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
