import { renderToStream } from "@react-pdf/renderer";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ReceiptPDFDocument } from "@/lib/pdf/receipt-pdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; receiptId: string }> }) {
  const { receiptId } = await params;

  const doc = await db.select().from(documents).where(eq(documents.id, receiptId)).then(r => r[0] ?? null);
  if (!doc || doc.type !== "receipt") {
    return new Response("Recibo não encontrado", { status: 404 });
  }

  const data = JSON.parse(doc.contentJson);

  const stream = await renderToStream(
    <ReceiptPDFDocument data={data} receiptId={receiptId} />
  );

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo-${receiptId.slice(0, 8)}.pdf"`,
    },
  });
}
