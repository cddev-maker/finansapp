"use client";
import { useState, useEffect } from "react";
import { BANK_LABELS, getBankLogoUrl, type BankName } from "@/constants/banks";

interface Props {
  bank: BankName;
  size?: number;
  showName?: boolean;
}

export function BankLogo({ bank, size = 16, showName = false }: Props) {
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className="inline-block rounded-sm bg-muted shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {!error ? (
        <img
          src={getBankLogoUrl(bank)}
          alt={BANK_LABELS[bank]}
          width={size}
          height={size}
          className="rounded-sm shrink-0"
          onError={() => setError(true)}
        />
      ) : (
        <span
          className="rounded-sm bg-muted flex items-center justify-center shrink-0 text-[8px] font-bold"
          style={{ width: size, height: size }}
        >
          {BANK_LABELS[bank].slice(0, 2).toUpperCase()}
        </span>
      )}
      {showName && <span className="text-xs font-medium">{BANK_LABELS[bank]}</span>}
    </span>
  );
}
