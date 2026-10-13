"use client";

import type { InvoiceFormState, InvoiceTotals } from "@/types/invoicing";

type Props = {
  invoice: InvoiceFormState;
  totals: InvoiceTotals;
  qrDataUrl: string;
};

const currencyFormat = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

const documentTitles = {
  INVOICE: "Invoice",
  QUOTATION_ESTIMATE: "Quotation / Estimate",
  PROFORMA: "Proforma Invoice",
  DELIVERY_CHALLAN: "Delivery Challan",
} as const;

export default function InvoiceLivePreview({ invoice, totals, qrDataUrl }: Props) {
  return (
    <section
      aria-label="Live document preview"
      className="mx-auto flex min-h-[760px] w-full max-w-[794px] flex-col rounded-2xl border border-slate-200 bg-white p-5 text-slate-800 shadow-sm sm:min-h-[820px] sm:p-8 print:min-h-0 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-300 pb-5">
        <div className="flex min-w-0 items-start gap-3">
          {invoice.business.logoDataUrl && (
            // Data URLs are user-selected local images validated before storing.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={invoice.business.logoDataUrl}
              alt=""
              className="h-14 w-14 rounded-lg object-contain"
            />
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {documentTitles[invoice.documentType]}
            </p>
            <h2 className="mt-1 break-words text-xl font-bold text-slate-900">
              {invoice.business.name || "Your business name"}
            </h2>
            {invoice.business.address && (
              <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{invoice.business.address}</p>
            )}
            <p className="text-sm text-slate-600">
              {[invoice.business.phone, invoice.business.email].filter(Boolean).join(" · ") || "Business contact details"}
            </p>
            {invoice.business.taxId && <p className="text-sm text-slate-600">Tax ID: {invoice.business.taxId}</p>}
          </div>
        </div>
        <div className="min-w-[150px] text-sm">
          <p><span className="font-semibold">No:</span> {invoice.documentNumber}</p>
          <p className="mt-1"><span className="font-semibold">Date:</span> {invoice.issueDate || "—"}</p>
          {invoice.dueDate && <p className="mt-1"><span className="font-semibold">Due:</span> {invoice.dueDate}</p>}
        </div>
      </div>

      <div className="py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bill to</p>
        <p className="mt-1 font-semibold text-slate-900">{invoice.client.name || "Client name"}</p>
        {invoice.client.address && <p className="whitespace-pre-line text-sm text-slate-600">{invoice.client.address}</p>}
        <p className="text-sm text-slate-600">
          {[invoice.client.phone, invoice.client.email].filter(Boolean).join(" · ")}
        </p>
        {invoice.client.taxId && <p className="text-sm text-slate-600">Tax ID: {invoice.client.taxId}</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-y border-slate-300 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <th className="px-2 py-3 font-semibold">Item</th>
              <th className="px-2 py-3 font-semibold">HSN/SAC</th>
              <th className="px-2 py-3 text-right font-semibold">Qty</th>
              <th className="px-2 py-3 text-right font-semibold">Rate</th>
              <th className="px-2 py-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-200">
                <td className="px-2 py-3">
                  <span className="font-medium">{item.description || "Item description"}</span>
                  {item.kind !== "GENERAL" && (
                    <span className="ml-2 text-xs text-slate-500">{item.kind === "LABOR" ? "Service" : "Material"}</span>
                  )}
                </td>
                <td className="px-2 py-3 text-slate-600">{item.hsnSac || "—"}</td>
                <td className="px-2 py-3 text-right">{item.quantity} {item.unit}</td>
                <td className="px-2 py-3 text-right">{currencyFormat(item.unitPrice, invoice.currency)}</td>
                <td className="px-2 py-3 text-right font-medium">
                  {currencyFormat(item.quantity * item.unitPrice, invoice.currency)}
                </td>
              </tr>
            ))}
            {invoice.visitingCharge > 0 && (
              <tr className="border-b border-slate-200">
                <td className="px-2 py-3 font-medium">Visiting charge</td>
                <td className="px-2 py-3">—</td>
                <td className="px-2 py-3 text-right">1</td>
                <td className="px-2 py-3 text-right">{currencyFormat(invoice.visitingCharge, invoice.currency)}</td>
                <td className="px-2 py-3 text-right font-medium">{currencyFormat(invoice.visitingCharge, invoice.currency)}</td>
              </tr>
            )}
            {invoice.items.length === 0 && (
              <tr><td colSpan={5} className="px-2 py-8 text-center text-slate-500">Add a line item to begin.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="ml-auto mt-5 w-full max-w-xs space-y-2 text-sm">
        <div className="flex justify-between gap-4"><span>Subtotal</span><span>{currencyFormat(totals.subtotal, invoice.currency)}</span></div>
        {totals.discountAmount > 0 && (
          <div className="flex justify-between gap-4 text-emerald-700">
            <span>Discount</span><span>−{currencyFormat(totals.discountAmount, invoice.currency)}</span>
          </div>
        )}
        {invoice.taxType !== "NONE" && (
          <div className="flex justify-between gap-4"><span>{invoice.taxType} ({invoice.taxRate}%)</span><span>{currencyFormat(totals.taxAmount, invoice.currency)}</span></div>
        )}
        {invoice.taxType === "GST" && invoice.gstMode === "CGST_SGST" && (
          <>
            <div className="flex justify-between gap-4 text-slate-600"><span>CGST</span><span>{currencyFormat(totals.cgst, invoice.currency)}</span></div>
            <div className="flex justify-between gap-4 text-slate-600"><span>SGST</span><span>{currencyFormat(totals.sgst, invoice.currency)}</span></div>
          </>
        )}
        <div className="flex justify-between gap-4 border-t border-slate-300 pt-3 text-base font-bold text-slate-900">
          <span>Total</span><span>{currencyFormat(totals.grandTotal, invoice.currency)}</span>
        </div>
      </div>

      {(invoice.warrantyTerms || invoice.business.upiId || invoice.business.bankName) && (
        <div className="mt-6 grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2">
          <div className="space-y-3 text-sm text-slate-600">
            {invoice.warrantyTerms && <p><span className="font-semibold text-slate-800">Warranty:</span> {invoice.warrantyTerms}</p>}
            {(invoice.business.upiId || invoice.business.bankName) && (
              <div>
                <p className="font-semibold text-slate-800">Payment details</p>
                {invoice.business.upiId && <p>UPI: {invoice.business.upiId}</p>}
                {invoice.business.bankName && <p>{invoice.business.bankName}</p>}
                {invoice.business.accountNumber && <p>Account: {invoice.business.accountNumber}</p>}
                {invoice.business.ifsc && <p>IFSC: {invoice.business.ifsc}</p>}
              </div>
            )}
          </div>
          {qrDataUrl && (
            <div className="flex items-center gap-3 sm:justify-end">
              {/* QR data is generated locally from the entered UPI ID and invoice total. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt={`UPI payment QR for ${currencyFormat(totals.grandTotal, invoice.currency)}`} className="h-24 w-24" />
              <p className="max-w-24 text-xs text-slate-500">Scan to pay {currencyFormat(totals.grandTotal, invoice.currency)}</p>
            </div>
          )}
        </div>
      )}

      {invoice.notes && (
        <div className="mt-auto border-t border-slate-200 pt-5 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Notes:</p>
          <p className="mt-1 whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}
    </section>
  );
}
