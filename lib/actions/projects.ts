"use server";

import { db } from "@/db";
import { emitNotification } from "./notifications";
import { projects } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function getProjects() {
  const result = await db.select().from(projects);
  return result;
}

export async function createProject(name: string) {
  const project = await db
    .insert(projects)
    .values({
      name,
      clientName: name,
      price: 0,
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
    })
    .returning();
  
    await emitNotification(
  "info",
  "Projeto criado",
  `O projeto "${name}" foi criado com sucesso.`,
  "low"
);

  revalidatePath("/adm");
  return project[0];
}