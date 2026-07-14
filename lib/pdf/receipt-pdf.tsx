import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import fs from "fs";
import path from "path";

const logoPath = path.resolve("public/logo.svg");
const logoBuffer = fs.readFileSync(logoPath);

const styles = StyleSheet.create({
  page: {
    padding: 50,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1A1A1A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 36,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
  },
  logoWrap: { width: 48, height: 38 },
  logo: { width: 48, height: 38 },
  companyBlock: { alignItems: "flex-end" },
  companyName: { fontSize: 14, fontWeight: "bold", color: "#1A1A1A", marginBottom: 2 },
  companyDetail: { fontSize: 8, color: "#6B7280", lineHeight: 1.5 },
  titleSection: { textAlign: "center", marginBottom: 32 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1A1A1A", letterSpacing: 6, marginBottom: 4 },
  receiptId: { fontSize: 8, color: "#9CA3AF" },
  metaGrid: { flexDirection: "row", marginBottom: 28 },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 7, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  metaValue: { fontSize: 10, color: "#1A1A1A", marginBottom: 8 },
  amountBox: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 4,
    marginBottom: 24,
    alignItems: "center",
  },
  amountLabel: { fontSize: 8, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  amountValue: { fontSize: 24, fontWeight: "bold", color: "#1A1A1A" },
  methodBox: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  methodPill: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  methodText: { fontSize: 8, color: "#FFFFFF", fontWeight: "bold", textTransform: "uppercase" },
  bankDetails: { marginBottom: 24 },
  bankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  bankLabel: { fontSize: 8, color: "#6B7280" },
  bankValue: { fontSize: 8, color: "#1A1A1A", fontWeight: "bold" },
  sectionTitle: { fontSize: 9, fontWeight: "bold", color: "#1A1A1A", marginBottom: 8, marginTop: 8 },
  noteText: { fontSize: 8, color: "#4B5563", lineHeight: 1.6, marginBottom: 8 },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
    alignItems: "center",
  },
  footerText: { fontSize: 7, color: "#9CA3AF" },
  signature: {
    marginTop: 40,
    alignItems: "center",
  },
  signatureLine: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: "#1A1A1A",
    marginBottom: 4,
  },
  signatureName: { fontSize: 9, color: "#1A1A1A", fontWeight: "bold" },
  signatureRole: { fontSize: 7, color: "#6B7280" },
});

function formatBRL(v: number) {
  return (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

type ReceiptData = {
  amount: number;
  date: string;
  method: string;
  note?: string;
  pixKey?: string | null;
  pixKeyType?: string | null;
  bankName?: string | null;
  bankAgency?: string | null;
  bankAccount?: string | null;
  companyName?: string;
  companyDocument?: string;
  createdAt?: string;
};

export function ReceiptPDFDocument({ data, receiptId }: { data: ReceiptData; receiptId: string }) {
  const isPix = data.method === "pix";
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
            <Image style={styles.logo} src={logoBuffer} />
          </View>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{data.companyName || "Empresa"}</Text>
            <Text style={styles.companyDetail}>CNPJ: {data.companyDocument || "—"}</Text>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>RECIBO</Text>
          <Text style={styles.receiptId}>#{receiptId.slice(0, 8).toUpperCase()}</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Data do Pagamento</Text>
            <Text style={styles.metaValue}>{formatDate(data.date)}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Forma de Pagamento</Text>
            <Text style={styles.metaValue}>{methodLabel[data.method] || data.method}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Data de Emissão</Text>
            <Text style={styles.metaValue}>{formatDate(data.createdAt || new Date().toISOString())}</Text>
          </View>
        </View>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Valor Recebido</Text>
          <Text style={styles.amountValue}>{formatBRL(data.amount)}</Text>
        </View>

        {isPix && data.pixKey && (
          <View style={styles.methodBox}>
            <View style={styles.methodPill}>
              <Text style={styles.methodText}>PIX · {data.pixKeyType?.toUpperCase()}: {data.pixKey}</Text>
            </View>
          </View>
        )}

        {!isPix && data.bankName && (
          <View style={styles.bankDetails}>
            <Text style={styles.sectionTitle}>Dados Bancários</Text>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Banco</Text>
              <Text style={styles.bankValue}>{data.bankName}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Agência</Text>
              <Text style={styles.bankValue}>{data.bankAgency || "—"}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Conta</Text>
              <Text style={styles.bankValue}>{data.bankAccount || "—"}</Text>
            </View>
          </View>
        )}

        {data.note && (
          <>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.noteText}>{data.note}</Text>
          </>
        )}

        <View style={styles.signature}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>{data.companyName || "Empresa"}</Text>
          <Text style={styles.signatureRole}>Recebedor</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {data.companyName || "Empresa"} · CNPJ: {data.companyDocument || "—"}
          </Text>
          <Text style={[styles.footerText, { marginTop: 2 }]}>
            Documento gerado em {formatDate(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
