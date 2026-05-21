import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-warm-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full h-10 px-3 rounded-lg border border-arena-200 bg-white text-warm-800",
          "placeholder:text-warm-400 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-arena-400 focus:border-transparent",
          "disabled:opacity-50 disabled:bg-arena-50",
          error && "border-red-400 focus:ring-red-400",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-warm-500">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-warm-700">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "w-full px-3 py-2 rounded-lg border border-arena-200 bg-white text-warm-800",
          "placeholder:text-warm-400 text-sm resize-y min-h-24",
          "focus:outline-none focus:ring-2 focus:ring-arena-400 focus:border-transparent",
          "disabled:opacity-50 disabled:bg-arena-50",
          error && "border-red-400 focus:ring-red-400",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-warm-500">{hint}</p>}
    </div>
  );
}
