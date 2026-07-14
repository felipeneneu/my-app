import { db } from "@/db";
import { clients, products, standardFases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NewOSClient } from "./client";

export default async function NewOSPage() {
  const [allClients, allProducts, allFases] = await Promise.all([
    db.select().from(clients).orderBy(clients.name),
    db.select().from(products).orderBy(products.name),
    db.select().from(standardFases).orderBy(standardFases.ordem),
  ]);

  return (
    <NewOSClient
      clients={allClients}
      products={allProducts.map(p => ({
        id: p.id,
        name: p.name,
        estimatedHours: p.estimatedHours,
        materialCost: p.materialCost,
      }))}
      standardFases={allFases.map(f => ({
        nome: f.nome,
        prazo_dias: f.prazo_dias,
      }))}
    />
  );
}
