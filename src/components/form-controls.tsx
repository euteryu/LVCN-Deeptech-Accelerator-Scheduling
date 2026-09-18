import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-[.12em] text-slate-500">
      {children}
    </label>
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative", className)}>
      <select
        {...props}
        className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white py-0 pl-3 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-slate-400" />
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100",
        props.className,
      )}
    />
  );
}

export function DatePickerField({
  value,
  onChange,
  ariaLabel,
  min,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  min?: string;
}) {
  const selected = value ? new Date(`${value}T12:00:00`) : undefined;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => selected ?? new Date());
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const minDate = min ? new Date(`${min}T00:00:00`) : undefined;
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));

  const chooseDay = (day: Date) => {
    if (minDate && day < minDate) return;
    onChange(format(day, "yyyy-MM-dd"));
    setMonth(day);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button type="button" aria-label={ariaLabel} onClick={() => setOpen((current) => !current)} className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
        <span className={value ? "text-slate-800" : "text-slate-400"}>{selected ? format(selected, "EEE, d MMM yyyy") : "Choose a date"}</span>
        <CalendarDays className="size-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-[19.5rem] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" aria-label="Previous month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ArrowLeft className="size-4" /></button>
            <p className="text-sm font-bold text-slate-900">{format(monthStart, "MMMM yyyy")}</p>
            <button type="button" aria-label="Next month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ArrowRight className="size-4" /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day} className="py-1">{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const disabled = (minDate && day < minDate) || day.getMonth() !== month.getMonth();
              const active = Boolean(selected && isSameDay(day, selected));
              return <button key={day.toISOString()} type="button" disabled={disabled} onClick={() => chooseDay(day)} className={cn("h-9 rounded-lg text-sm transition", active ? "bg-[#162c5b] font-bold text-white" : "text-slate-700 hover:bg-indigo-50", disabled && "cursor-not-allowed text-slate-300 hover:bg-transparent")}>{format(day, "d")}</button>;
            })}
          </div>
          <button type="button" onClick={() => chooseDay(new Date())} className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Today</button>
        </div>
      )}
    </div>
  );
}
