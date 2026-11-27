export function LookupForm({
  defaultValue,
  example = "SLN-2026-000123",
  id = "number",
  size = "md",
}: {
  defaultValue?: string;
  /** Example number shown as the placeholder. */
  example?: string;
  /** Input id; must be unique when the form appears twice on a page. */
  id?: string;
  size?: "md" | "lg";
}) {
  const h = size === "lg" ? "h-13 text-base" : "h-12 text-[15px]";
  return (
    <form action="/v" method="get" role="search" className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold text-brand-deep">
        Certificate number
      </label>
      <div className="flex flex-wrap gap-2.5">
        <input
          id={id}
          name="number"
          required
          maxLength={30}
          defaultValue={defaultValue}
          placeholder={`e.g. ${example}`}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          className={`input ${h} min-w-0 flex-[1_1_220px] bg-[#fffdf8] font-mono tracking-wide uppercase placeholder:normal-case placeholder:text-[#8b7a72]`}
        />
        <button type="submit" className={`btn-primary ${h} shrink-0 px-7 font-bold`}>
          Verify
        </button>
      </div>
    </form>
  );
}
