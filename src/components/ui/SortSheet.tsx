'use client';

import React, { useEffect, useId, useState } from 'react';
import { Check, SlidersHorizontal, X } from 'lucide-react';

export interface SortSheetOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface SortSheetProps<T extends string> {
  value: T;
  options: ReadonlyArray<SortSheetOption<T>>;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

export function SortSheet<T extends string>({
  value,
  options,
  onChange,
  label = 'Ordenar',
  className = '',
}: SortSheetProps<T>) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-full border border-[#DCCFC0] bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#21162C] transition-colors hover:border-[#9A7B4F] focus:outline-none focus:border-[#5B2B84] ${className}`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-[#9A7B4F]" />
        <span className="truncate">{selected ? selected.label : label}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
          role="presentation"
        >
          <div
            className="absolute inset-0 bg-[#21162C]/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="sheet-enter relative w-full max-w-md rounded-t-3xl border border-[#E7DFD3] bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#DCCFC0] sm:hidden" />

            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2
                  id={titleId}
                  className="font-display text-xl font-semibold text-[#21162C]"
                >
                  {label}
                </h2>
                <p className="text-[11px] text-[#6B6272]">
                  Elige cómo quieres ver los resultados.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E7DFD3] bg-[#F6F3EE] text-[#21162C] hover:border-[#9A7B4F]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? 'border-[#2C1440] bg-[#2C1440] text-white'
                        : 'border-[#E7DFD3] bg-[#FAF8F5] text-[#21162C] hover:border-[#9A7B4F]'
                    }`}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium">{option.label}</span>
                      {option.hint && (
                        <span
                          className={`text-[11px] ${
                            isSelected ? 'text-white/75' : 'text-[#8A8290]'
                          }`}
                        >
                          {option.hint}
                        </span>
                      )}
                    </span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-white bg-white text-[#2C1440]'
                          : 'border-[#DCCFC0]'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
