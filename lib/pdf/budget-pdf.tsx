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
  budgetId: { fontSize: 8, color: "#9CA3AF" },
  metaGrid: { flexDirection: "row", marginBottom: 28 },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 7, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  metaValue: { fontSize: 10, color: "#1A1A1A", marginBottom: 8 },
  table: { marginBottom: 24 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: { fontSize: 7, fontWeight: "bold", color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 1 },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableRowAlt: { backgroundColor: "#F3F4F6" },
  tableCell: { fontSize: 9, color: "#1A1A1A" },
  tableCellRight: { fontSize: 9, color: "#1A1A1A", textAlign: "right" },
  colNum: { width: "8%" },
  colDesc: { width: "54%" },
  colHours: { width: "15%" },
  colTotal: { width: "23%" },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 2,
    borderTopColor: "#1A1A1A",
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  totalLabel: { fontSize: 10, fontWeight: "bold", color: "#1A1A1A", textTransform: "uppercase", letterSpacing: 1 },
  totalValue: { fontSize: 16, fontWeight: "bold", color: "#1A1A1A" },
  totalHours: { fontSize: 8, color: "#6B7280", marginTop: 2, textAlign: "right" },
  conditionsTitle: { fontSize: 9, fontWeight: "bold", color: "#1A1A1A", marginBottom: 4, marginTop: 12 },
  conditionsText: { fontSize: 8, color: "#4B5563", lineHeight: 1.6, marginBottom: 4 },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
    alignItems: "center",
  },
  footerText: { fontSize: 7, color: "#9CA3AF" },
});

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

type ItemData = {
  name: string;
  estimatedHours?: number;
  hours?: number;
  quantity?: number;
  calculatedPrice?: number;
  value?: number;
};

type Props = {
  data: Record<string, any>;
  company: Record<string, any> | null;
  budgetId: string;
};

export function BudgetPDFDocument({ data, company, budgetId }: Props) {
  const items: ItemData[] = data.items ?? [];
  const totalPrice = data.totalPrice ?? 0;
  const totalHours = data.totalHours ?? items.reduce(
    (s: number, i: ItemData) => s + ((i.estimatedHours || i.hours || 0) * (i.quantity || 1)), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <View style={styles.logoWrap}>
            <Image style={styles.logo} src={logoBuffer} />
          </View>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{company?.tradingName || "Empresa"}</Text>
            <Text style={styles.companyDetail}>CNPJ: {company?.document || "—"}</Text>
            {company?.street && (
              <Text style={styles.companyDetail}>
                {company.street}, {company.number || "s/n"} — {company.neighborhood}, {company.city}/{company.state}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>ORÇAMENTO</Text>
          <Text style={styles.budgetId}>#{budgetId.slice(0, 8).toUpperCase()}</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Cliente</Text>
            <Text style={styles.metaValue}>{data.clientName || "—"}</Text>
            <Text style={styles.metaLabel}>Documento</Text>
            <Text style={styles.metaValue}>{data.clientDocument || "—"}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Data de emissão</Text>
            <Text style={styles.metaValue}>{formatDate(data.createdAt)}</Text>
            <Text style={styles.metaLabel}>Validade</Text>
            <Text style={styles.metaValue}>30 dias</Text>
          </View>
        </View>

        {items.length > 0 && (
          <View style={styles.table} wrap={false}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colNum]}>#</Text>
              <Text style={[styles.tableHeaderCell, styles.colDesc]}>Item</Text>
              <Text style={[styles.tableHeaderCell, styles.colHours]}>Horas</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
            </View>
            {items.map((item: ItemData, i: number) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
                <Text style={[styles.tableCell, styles.colNum]}>{(i + 1).toString().padStart(2, "0")}</Text>
                <Text style={[styles.tableCell, styles.colDesc]}>{item.name}</Text>
                <Text style={[styles.tableCellRight, styles.colHours]}>{item.estimatedHours || item.hours || 0}h</Text>
                <Text style={[styles.tableCellRight, styles.colTotal]}>{formatBRL(item.calculatedPrice || item.value || 0)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Valor total</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.totalValue}>{formatBRL(totalPrice)}</Text>
            <Text style={styles.totalHours}>{totalHours}h de trabalho</Text>
          </View>
        </View>

        <Text style={styles.conditionsTitle}>Condições</Text>
        <Text style={styles.conditionsText}>
          Prazo de entrega: {data.deadline || "30 dias"}. Orçamento válido por 30 dias. Preços em Reais (BRL).
        </Text>
        {data.notes && (
          <>
            <Text style={styles.conditionsTitle}>Observações</Text>
            <Text style={styles.conditionsText}>{data.notes}</Text>
          </>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {company?.tradingName || "Empresa"} · {company?.email || ""} · {company?.phone || ""}
          </Text>
          <Text style={[styles.footerText, { marginTop: 2 }]}>
            Documento gerado em {formatDate(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
