"use server";

import { db } from "@/db";
import { emitNotification } from "./notifications";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
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

export async function deleteProject(id: string) {
  const project = await db.select().from(projects).where(eq(projects.id, id)).then(r => r[0]);
  if (!project) return;
  await db.delete(projects).where(eq(projects.id, id));
  await emitNotification(
    "system",
    "Projeto removido",
    `O projeto "${project.name}" foi removido permanentemente.`,
    "low"
  );
  revalidatePath("/adm");
}