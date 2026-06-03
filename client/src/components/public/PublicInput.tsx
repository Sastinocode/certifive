import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

const inputBase = [
  "w-full min-h-[48px] px-[14px] py-3 border-[1.5px] border-pub-border rounded-[12px]",
  "bg-white text-[14.5px] text-pub-ink font-sans transition-all duration-150",
  "hover:border-[#cdd1d8]",
  "focus:outline-none focus:border-pub-primary focus:shadow-[0_0_0_4px_hsl(142_69%_36%/0.12)]",
  "placeholder:text-pub-muted/60",
].join(" ");

// ── Label ──────────────────────────────────────────────────────────────────

interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  optional?: boolean;
}

export function FieldLabel({ htmlFor, children, optional }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-pub-ink mb-2">
      {children}
      {optional && <span className="text-[#8a939e] font-medium ml-1">(opcional)</span>}
    </label>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-[12px] text-pub-muted mt-1.5">{children}</p>;
}

// ── Input ──────────────────────────────────────────────────────────────────

interface PublicInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  optional?: boolean;
  suffix?: string;
  prefixIcon?: ReactNode;
}

export function PublicInput({ label, hint, optional, suffix, prefixIcon, className = "", id, ...props }: PublicInputProps) {
  return (
    <div>
      {label && <FieldLabel htmlFor={id} optional={optional}>{label}</FieldLabel>}
      <div className="relative">
        {prefixIcon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pub-muted w-4 h-4 flex items-center justify-center pointer-events-none">
            {prefixIcon}
          </span>
        )}
        <input
          id={id}
          className={`${inputBase} ${prefixIcon ? "pl-11" : ""} ${suffix ? "pr-14" : ""} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-pub-muted pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────────────────

interface PublicSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  optional?: boolean;
}

export function PublicSelect({ label, hint, optional, className = "", id, children, ...props }: PublicSelectProps) {
  return (
    <div>
      {label && <FieldLabel htmlFor={id} optional={optional}>{label}</FieldLabel>}
      <select
        id={id}
        className={`${inputBase} appearance-none pr-10 bg-[url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235e6772' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_14px_center] bg-[length:16px] ${className}`}
        {...props}
      >
        {children}
      </select>
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────────────────────

interface PublicTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  optional?: boolean;
}

export function PublicTextarea({ label, hint, optional, className = "", id, ...props }: PublicTextareaProps) {
  return (
    <div>
      {label && <FieldLabel htmlFor={id} optional={optional}>{label}</FieldLabel>}
      <textarea
        id={id}
        className={`${inputBase} min-h-[110px] resize-y leading-relaxed ${className}`}
        {...props}
      />
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

// ── Checkbox ───────────────────────────────────────────────────────────────

interface PublicCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function PublicCheckbox({ checked, onChange, children, className = "" }: PublicCheckboxProps) {
  return (
    <label className={`flex items-start gap-2.5 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange?.(e.target.checked)}
        className={[
          "w-[18px] h-[18px] rounded-[4px] border-[1.5px] border-[#cdd1d8] appearance-none cursor-pointer relative flex-shrink-0 mt-0.5",
          "checked:bg-pub-primary checked:border-pub-primary",
          "checked:after:content-[''] checked:after:absolute checked:after:inset-0",
          "checked:after:bg-[url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'%3E%3Cpath d='M13.5 4.5L6 12l-3.5-3.5 1-1L6 10 12.5 3.5z'/%3E%3C/svg%3E\")] checked:after:bg-center checked:after:bg-[length:12px] checked:after:bg-no-repeat",
        ].join(" ")}
      />
      <span className="text-xs text-pub-muted leading-relaxed pt-0.5">{children}</span>
    </label>
  );
}
