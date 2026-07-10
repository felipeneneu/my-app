"use server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { DEFAULT_PRODUCTS } from "@/lib/seed-products";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  estimatedHours: number;
  materialCost: number;
  category: "branding" | "ui-ux" | "dev" | "consulting" | "other";
  createdAt: string;
};

export async function getProducts(category?: string) {
  const query = db.select().from(products).orderBy(products.name);
  if (category) {
    return query.where(eq(products.category, category as any)) as Promise<Product[]>;
  }
  return query as Promise<Product[]>;
}

export async function getProduct(id: string) {
  return db.select().from(products).where(eq(products.id, id)).then(r => r[0] ?? null) as Promise<Product | null>;
}

export async function createProduct(data: {
  name: string;
  description?: string;
  estimatedHours?: number;
  materialCost?: number;
  category?: string;
}) {
  const product = await db.insert(products).values({
    name: data.name,
    description: data.description ?? null,
    estimatedHours: data.estimatedHours ?? 0,
    materialCost: data.materialCost ?? 0,
    category: (data.category ?? "other") as any,
  }).returning() as unknown as Product[];

  revalidatePath("/adm/products");
  return product[0];
}

export async function updateProduct(id: string, data: Partial<{
  name: string;
  description: string;
  estimatedHours: number;
  materialCost: number;
  category: string;
}>) {
  await db.update(products).set(data as any).where(eq(products.id, id));
  revalidatePath("/adm/products");
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/adm/products");
}

export async function seedDefaultProducts() {
  const existing = await db.select().from(products).limit(1);
  if (existing.length > 0) return { seeded: false, count: 0 };

  for (const p of DEFAULT_PRODUCTS) {
    await db.insert(products).values(p);
  }

  revalidatePath("/adm/products");
  return { seeded: true, count: DEFAULT_PRODUCTS.length };
}

export async function countProducts() {
  const rows = await db.select({ count: products.id }).from(products);
  return rows.length;
}
