import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import fs from "fs";
import path from "path";

const logoPath = path.resolve("public/logo.svg");
let logoBuffer: Buffer | null = null;
try {
  logoBuffer = fs.readFileSync(logoPath);
} catch {};

const styles = StyleSheet.create({
  page: {
    padding: 45,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1A1A1A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#1A1A1A",
  },
  logoWrap: { width: 56, height: 44 },
  logo: { width: 56, height: 44 },
  logoPlaceholder: { width: 56, height: 44, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  logoInitial: { fontSize: 18, color: "#9CA3AF", fontFamily: "Helvetica-Bold" },
  companyBlock: { alignItems: "flex-end", maxWidth: "60%" },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1A1A1A", marginBottom: 2 },
  companyDetail: { fontSize: 7, color: "#6B7280", lineHeight: 1.5, textAlign: "right" },
  titleSection: { marginBottom: 24 },
  title: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#1A1A1A", letterSpacing: 4 },
  subtitle: { fontSize: 7, color: "#9CA3AF", marginTop: 2 },
  clientBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  clientLabel: { fontSize: 7, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  clientName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1A1A1A", marginBottom: 2 },
  clientDoc: { fontSize: 8, color: "#6B7280" },
  infoRow: { flexDirection: "row", marginBottom: 20, gap: 24 },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 7, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  infoValue: { fontSize: 9, color: "#1A1A1A" },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeadCell: { fontSize: 7, color: "#FFFFFF", fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  colItem: { flex: 3 },
  colDesc: { flex: 2 },
  colValue: { flex: 1, textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableRowAlt: { backgroundColor: "#F9FAFB" },
  tableCell: { fontSize: 8, color: "#1A1A1A" },
  totalBox: {
    marginTop: 16,
    marginLeft: "auto",
    width: "50%",
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalLabel: { fontSize: 8, color: "#6B7280" },
  totalValue: { fontSize: 8, color: "#1A1A1A", fontFamily: "Helvetica-Bold", textAlign: "right" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 2,
    borderTopColor: "#1A1A1A",
    marginTop: 4,
  },
  grandTotalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1A1A1A" },
  grandTotalValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1A1A1A" },
  discountText: { fontSize: 7, color: "#059669", fontFamily: "Helvetica-Bold" },
  pixInline: { flexDirection: "row", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#D1D5DB", gap: 12, alignItems: "center" },
  qrWrap: { width: 80, height: 80 },
  qrImage: { width: 80, height: 80 },
  pixInfo: { flex: 1 },
  pixLabel: { fontSize: 7, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  pixKey: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1A1A1A", marginBottom: 2 },
  pixHint: { fontSize: 7, color: "#9CA3AF" },
  paymentTermsBox: {
    marginTop: 16,
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  paymentTermsLabel: { fontSize: 7, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  paymentTermsValue: { fontSize: 8, color: "#1A1A1A", lineHeight: 1.5 },
  signature: { alignItems: "center", marginTop: 32 },
  signatureLine: { width: 240, borderTopWidth: 1, borderTopColor: "#1A1A1A", marginBottom: 4 },
  signatureName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1A1A1A" },
  signatureRole: { fontSize: 7, color: "#6B7280" },
  footer: {
    marginTop: "auto",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
    alignItems: "center",
  },
  footerText: { fontSize: 6, color: "#9CA3AF" },
});

function formatBRL(v: number) {
  return (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export type InvoiceData = {
  invoiceNumber: string;
  clientName: string;
  clientDocument: string;
  clientAddress?: string;
  companyName: string;
  companyDocument: string;
  companyAddress: string;
  companyCity: string;
  items: string[];
  totalPrice: number;
  paymentTerms: string;
  pixKey?: string;
  pixKeyType?: string;
  hiringBonus?: number;
  isPix: boolean;
  qrDataUrl?: string | null;
  createdAt: string;
};

export function InvoicePDFDocument({ data }: { data: InvoiceData }) {
  const pixDiscount = data.isPix ? Math.round(data.totalPrice * 0.1) : 0;
  const bonus = data.hiringBonus ?? 0;
  const subtotal = data.totalPrice;
  const totalAfterDiscounts = subtotal - pixDiscount - bonus;

  const methodLabel: Record<string, string> = {
    pix: "PIX",
    transfer: "Transferência Bancária",
    cash: "Dinheiro",
    credit: "Cartão de Crédito",
    debit: "Cartão de Débito",
    other: "Outro",
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.logoWrap}>
            {logoBuffer ? (
              <Image style={styles.logo} src={logoBuffer} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoInitial}>{data.companyName.charAt(0)}</Text>
              </View>
            )}
          </View>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{data.companyName}</Text>
            <Text style={styles.companyDetail}>CNPJ: {data.companyDocument || "—"}</Text>
            <Text style={styles.companyDetail}>{data.companyAddress}</Text>
            <Text style={styles.companyDetail}>{data.companyCity}</Text>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>FATURA</Text>
          <Text style={styles.subtitle}>Nº {data.invoiceNumber} · Emissão: {formatDate(data.createdAt)}</Text>
        </View>

        <View style={styles.clientBox}>
          <Text style={styles.clientLabel}>Cliente</Text>
          <Text style={styles.clientName}>{data.clientName}</Text>
          <Text style={styles.clientDoc}>
            {data.clientDocument ? `CPF/CNPJ: ${data.clientDocument}` : ""}
            {data.clientAddress ? ` · ${data.clientAddress}` : ""}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Data de Emissão</Text>
            <Text style={styles.infoValue}>{formatDate(data.createdAt)}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Forma de Pagamento</Text>
            <Text style={styles.infoValue}>{data.isPix ? "PIX" : "Transferência"}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Vencimento</Text>
            <Text style={styles.infoValue}>{formatDate(data.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.tableHead}>
          <Text style={[styles.tableHeadCell, styles.colItem]}>Serviços / Fases</Text>
        </View>

        {data.items.map((item, i) => (
          <View key={i} style={i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
            <Text style={[styles.tableCell, styles.colItem]}>{item}</Text>
          </View>
        ))}

        <View style={styles.totalBox} break>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatBRL(subtotal)}</Text>
          </View>

          {pixDiscount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.discountText]}>Desconto PIX (10%)</Text>
              <Text style={[styles.totalValue, styles.discountText]}>-{formatBRL(pixDiscount)}</Text>
            </View>
          )}

          {bonus > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.discountText]}>Bônus de Contratação</Text>
              <Text style={[styles.totalValue, styles.discountText]}>-{formatBRL(bonus)}</Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Valor a Pagar</Text>
            <Text style={styles.grandTotalValue}>{formatBRL(totalAfterDiscounts)}</Text>
          </View>

          {data.isPix && data.qrDataUrl && (
            <View style={styles.pixInline}>
              <View style={styles.qrWrap}>
                <Image style={styles.qrImage} src={data.qrDataUrl} />
              </View>
              <View style={styles.pixInfo}>
                <Text style={styles.pixLabel}>Pague via PIX</Text>
                <Text style={styles.pixKey}>Chave: {data.pixKey}</Text>
                <Text style={styles.pixHint}>
                  {data.pixKeyType === "cpf" ? "CPF" : data.pixKeyType === "cnpj" ? "CNPJ" : data.pixKeyType === "email" ? "E-mail" : data.pixKeyType === "phone" ? "Telefone" : "Chave aleatória"}
                </Text>
                <Text style={styles.pixHint}>Valor: {formatBRL(totalAfterDiscounts)}</Text>
              </View>
            </View>
          )}
        </View>

        {data.paymentTerms && !data.isPix && (
          <View style={styles.paymentTermsBox}>
            <Text style={styles.paymentTermsLabel}>Condições de Pagamento</Text>
            <Text style={styles.paymentTermsValue}>{data.paymentTerms}</Text>
          </View>
        )}

        <View style={styles.signature}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>{data.companyName}</Text>
          <Text style={styles.signatureRole}>Emitente</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {data.companyName} · CNPJ: {data.companyDocument || "—"}
          </Text>
          <Text style={[styles.footerText, { marginTop: 1 }]}>
            {data.companyAddress} · {data.companyCity}
          </Text>
          <Text style={[styles.footerText, { marginTop: 1 }]}>
            Documento gerado em {formatDate(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
