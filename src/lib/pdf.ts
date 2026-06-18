"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Transaction, Payment, Budget, DashboardSummary } from "@/types";
import { CATEGORY_LABELS, PAYMENT_STATUS_LABELS, MONTH_NAMES } from "@/constants";

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  `₺${Math.abs(v).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  // Background gradient strip
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 210, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("₺ FinansApp", 14, 16);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 25);

  doc.setFontSize(9);
  doc.setTextColor(200, 200, 255);
  doc.text(subtitle, 14, 32);

  // Right side: date
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`Oluşturulma: ${new Date().toLocaleDateString("tr-TR")}`, 196, 32, { align: "right" });

  doc.setTextColor(30, 41, 59);
}

function addKPIRow(doc: jsPDF, y: number, kpis: { label: string; value: string; color?: string }[]) {
  const colW = (210 - 28) / kpis.length;
  kpis.forEach((kpi, i) => {
    const x = 14 + i * colW;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, colW - 4, 20, 3, 3, "F");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label.toUpperCase(), x + (colW - 4) / 2, y + 7, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(kpi.color ? kpi.color : "#1e293b");
    doc.text(kpi.value, x + (colW - 4) / 2, y + 15, { align: "center" });
  });
  doc.setTextColor(30, 41, 59);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text(`Sayfa ${i} / ${pageCount}`, 196, 290, { align: "right" });
    doc.text("FinansApp — Kişisel Finans Yönetimi", 14, 290);
  }
}

// ─── Monthly PDF ──────────────────────────────────────────────────────────────

export function generateMonthlyPDF(
  transactions: Transaction[],
  payments: Payment[],
  budgets: Budget[],
  year: number,
  month: number
): void {
  const doc       = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const monthName = MONTH_NAMES[month];
  const title     = `${monthName} ${year} — Aylık Finans Raporu`;

  addHeader(doc, title, `${year} yılı ${monthName} dönemi finansal özet raporu`);

  const income  = transactions.filter((t) => t.type === "INCOME") .reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;

  // KPIs
  addKPIRow(doc, 42, [
    { label: "Toplam Gelir",  value: fmt(income),  color: "#10b981" },
    { label: "Toplam Gider",  value: fmt(expense), color: "#ef4444" },
    { label: "Net Tasarruf",  value: fmt(savings),  color: savings >= 0 ? "#6366f1" : "#ef4444" },
    { label: "İşlem Sayısı", value: String(transactions.length) },
  ]);

  // Transactions table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("İşlem Detayları", 14, 72);

  autoTable(doc, {
    startY: 75,
    head: [["Tarih", "Açıklama", "Kategori", "Tür", "Tutar"]],
    body: transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((t) => [
        new Date(t.date).toLocaleDateString("tr-TR"),
        t.description,
        CATEGORY_LABELS[t.category],
        t.type === "INCOME" ? "Gelir" : "Gider",
        t.type === "INCOME" ? `+${fmt(t.amount)}` : `-${fmt(t.amount)}`,
      ]),
    styles:      { fontSize: 8, cellPadding: 3 },
    headStyles:  { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 65 },
      2: { cellWidth: 30 },
      3: { cellWidth: 18 },
      4: { cellWidth: 30, halign: "right" },
    },
    didParseCell(data) {
      if (data.column.index === 4 && data.section === "body") {
        const val = String(data.cell.raw);
        data.cell.styles.textColor = val.startsWith("+") ? [16, 185, 129] : [239, 68, 68];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Budget summary
  if (budgets.length > 0) {
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Bütçe Durumu", 14, finalY);

    autoTable(doc, {
      startY: finalY + 3,
      head: [["Kategori", "Bütçe", "Harcama", "Kalan", "Kullanım %"]],
      body: budgets.map((b) => {
        const spent  = b.spent ?? 0;
        const pct    = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
        return [
          CATEGORY_LABELS[b.category],
          fmt(b.amount),
          fmt(spent),
          fmt(Math.max(b.amount - spent, 0)),
          `%${pct}`,
        ];
      }),
      styles:     { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: "bold" },
    });
  }

  addFooter(doc);
  doc.save(`finansapp-rapor-${year}-${String(month + 1).padStart(2, "0")}.pdf`);
}

// ─── Yearly PDF ───────────────────────────────────────────────────────────────

export function generateYearlyPDF(transactions: Transaction[], year: number): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  addHeader(doc, `${year} Yıllık Finans Raporu`, `${year} yılına ait tüm finansal hareketlerin özeti`);

  const totalIncome  = transactions.filter((t) => t.type === "INCOME") .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const totalSavings = totalIncome - totalExpense;

  addKPIRow(doc, 42, [
    { label: "Yıllık Gelir",  value: fmt(totalIncome),  color: "#10b981" },
    { label: "Yıllık Gider",  value: fmt(totalExpense), color: "#ef4444" },
    { label: "Yıllık Tasarruf", value: fmt(totalSavings), color: totalSavings >= 0 ? "#6366f1" : "#ef4444" },
    { label: "Toplam İşlem",  value: String(transactions.length) },
  ]);

  // Monthly breakdown
  const monthlyData = Array.from({ length: 12 }, (_, m) => {
    const tx = transactions.filter((t) => new Date(t.date).getMonth() === m);
    const inc = tx.filter((t) => t.type === "INCOME") .reduce((s, t) => s + t.amount, 0);
    const exp = tx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    return [MONTH_NAMES[m], fmt(inc), fmt(exp), fmt(inc - exp), `%${inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0}`];
  });

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Aylık Özet", 14, 72);

  autoTable(doc, {
    startY:     75,
    head:       [["Ay", "Gelir", "Gider", "Net Tasarruf", "Tasarruf Oranı"]],
    body:       monthlyData,
    styles:     { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // Category breakdown
  const catMap: Record<string, number> = {};
  transactions.filter((t) => t.type === "EXPENSE").forEach((t) => {
    catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
  });

  const catRows = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => [
      CATEGORY_LABELS[cat as never],
      fmt(amount),
      `%${totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0}`,
    ]);

  if (catRows.length > 0) {
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Kategori Bazlı Harcamalar", 14, finalY);
    autoTable(doc, {
      startY:     finalY + 3,
      head:       [["Kategori", "Tutar", "Oran"]],
      body:       catRows,
      styles:     { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: "bold" },
    });
  }

  addFooter(doc);
  doc.save(`finansapp-yillik-rapor-${year}.pdf`);
}
