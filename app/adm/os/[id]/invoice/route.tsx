import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents, companyInfo, clients, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { renderToStream } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { InvoicePDFDocument, type InvoiceData } from "@/lib/pdf/invoice-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bonusParam = req.nextUrl.searchParams.get("bonus") || "0";
    const hiringBonus = Math.max(0, parseInt(bonusParam, 10) || 0);

    const doc = await db.select().from(documents).where(eq(documents.id, id)).then(r => r[0]);
    if (!doc || doc.type !== "os") {
      return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
    }

    const osData = JSON.parse(doc.contentJson) as Record<string, unknown>;
    const company = await db.select().from(companyInfo).limit(1).then(r => r[0] ?? null);

    let clientDocument = (osData.clientDocument as string) || "";
    let clientAddress = "";

    if (osData.clientName && doc.projectId) {
      const project = await db.select().from(projects).where(eq(projects.id, doc.projectId)).then(r => r[0]);
      if (project?.clientId) {
        const client = await db.select().from(clients).where(eq(clients.id, project.clientId)).then(r => r[0]);
        if (client) {
          clientDocument = client.document ?? clientDocument;
          const parts = [client.street, client.number, client.neighborhood].filter(Boolean);
          clientAddress = parts.join(", ");
        }
      }
    }

    const phases = (osData.phases as { name: string }[]) || [];
    const items = (osData.items as { name: string }[]) || [];
    const itemNames = items.length > 0
      ? items.map(i => i.name)
      : phases.map(p => p.name);

    const totalPrice = (osData.totalPrice as number) || 0;
    const paymentTerms = (osData.paymentTerms as string) || "";
    const isPix = paymentTerms.toLowerCase().includes("pix") && !paymentTerms.includes("2×");

    const companyAddress = [company?.street, company?.number, company?.neighborhood].filter(Boolean).join(", ");
    const companyCity = [company?.city, company?.state].filter(Boolean).join(" - ");

    let qrDataUrl: string | null = null;
    if (isPix && company?.pixKey) {
      const pixDiscount = Math.round(totalPrice * 0.1);
      const bonus = hiringBonus;
      const totalAfterDiscounts = totalPrice - pixDiscount - bonus;
      const pixPayload = `00020126360014BR.GOV.BCB.PIX0114${company.pixKey}520400005303986540${String(totalAfterDiscounts).length}${totalAfterDiscounts}5802BR5925${company.tradingName || ""}6008BRASILIA62070503***6304`;
      qrDataUrl = await QRCode.toDataURL(pixPayload, { width: 200, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
    }

    const allDocs = await db.select({ id: documents.id }).from(documents).where(eq(documents.type, "os"));
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(allDocs.length + 1).padStart(3, "0")}`;

    const invoiceData: InvoiceData = {
      invoiceNumber,
      clientName: (osData.clientName as string) || "",
      clientDocument,
      clientAddress,
      companyName: company?.tradingName || "Empresa",
      companyDocument: company?.document || "",
      companyAddress,
      companyCity,
      items: itemNames,
      totalPrice,
      paymentTerms,
      pixKey: company?.pixKey || undefined,
      pixKeyType: company?.pixKeyType || undefined,
      hiringBonus,
      isPix,
      qrDataUrl,
      createdAt: (osData.createdAt as string) || new Date().toISOString(),
    };

    const stream = await renderToStream(<InvoicePDFDocument data={invoiceData} />);
    const chunks: Buffer[] = [];
    for await (const chunk of stream as unknown as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="fatura-${invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar fatura" },
      { status: 500 }
    );
  }
}
