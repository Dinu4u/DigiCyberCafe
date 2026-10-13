export type InvoiceDocumentType =
  | "INVOICE"
  | "QUOTATION_ESTIMATE"
  | "PROFORMA"
  | "DELIVERY_CHALLAN";

export type InvoicePersona =
  | "FREELANCER"
  | "TRADESPERSON"
  | "TRADER_RETAIL"
  | "GENERAL";

export type InvoiceCurrency = "INR" | "USD" | "EUR" | "GBP";
export type InvoiceDiscountType = "PERCENT" | "FLAT";
export type InvoiceTaxType = "NONE" | "GST" | "VAT" | "SALES_TAX";
export type InvoiceGstMode = "CGST_SGST" | "IGST";
export type InvoiceItemKind = "GENERAL" | "MATERIAL" | "LABOR";
export type FreelancerRateMode = "HOURLY" | "FIXED";

export type InvoiceParty = {
  name: string;
  phone: string;
  address: string;
  email: string;
  taxId: string;
};

export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  hsnSac: string;
  kind: InvoiceItemKind;
};

export type InvoiceBusinessProfile = InvoiceParty & {
  upiId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  swift: string;
  logoDataUrl: string;
};

export type InvoiceFormState = {
  documentType: InvoiceDocumentType;
  documentNumber: string;
  issueDate: string;
  dueDate: string;
  persona: InvoicePersona;
  freelancerRateMode: FreelancerRateMode;
  currency: InvoiceCurrency;
  business: InvoiceBusinessProfile;
  client: InvoiceParty;
  items: InvoiceLineItem[];
  discountType: InvoiceDiscountType;
  discountValue: number;
  taxType: InvoiceTaxType;
  taxRate: number;
  gstMode: InvoiceGstMode;
  visitingCharge: number;
  warrantyTerms: string;
  notes: string;
};

export type InvoiceTotals = {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
};
