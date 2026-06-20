"use client";
import { BANK_LABELS, getBankLogoUrl, type BankName } from "@/constants/banks";

interface Props {
  bank: BankName;
  size?: number;
  showName?: boolean;
}

export function BankLogo({ bank, size = 16, showName = false }: Props) {
  const label = BANK_LABELS[bank];
  const url = getBankLogoUrl(bank);

  return (
    <span className="inline-flex items-center gap-1.5" suppressHydrationWarning>
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 2,
          backgroundImage: `url(${url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#e5e7eb",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {showName && <span className="text-xs font-medium">{label}</span>}
    </span>
  );
}
