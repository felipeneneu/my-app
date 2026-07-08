"use server";

import { db } from "@/db";
import { companyInfo } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  tradingName: z.string().min(1, "Nome fantasia é obrigatório"),
  legalName: z.string().optional().default(""),
  document: z.string().optional().default(""),
  stateRegistration: z.string().optional().default(""),
  cep: z.string().optional().default(""),
  street: z.string().optional().default(""),
  number: z.string().optional().default(""),
  complement: z.string().optional().default(""),
  neighborhood: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  logo: z.string().optional().default(""),
  bankName: z.string().optional().default(""),
  bankAgency: z.string().optional().default(""),
  bankAccount: z.string().optional().default(""),
  pixKey: z.string().optional().default(""),
  pixKeyType: z.enum(["cpf", "cnpj", "email", "phone", "random"]).optional().default("random"),
});

export async function getCompany() {
  const rows = await db.select().from(companyInfo).limit(1);
  return rows[0] ?? null;
}

export async function saveCompany(prevState: unknown, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const existing = await db.select().from(companyInfo).limit(1);
  if (existing[0]) {
    await db.update(companyInfo).set(parsed.data).where(eq(companyInfo.id, existing[0].id));
  } else {
    await db.insert(companyInfo).values(parsed.data);
  }

  revalidatePath("/adm/company");
  return { success: true as const };
}
