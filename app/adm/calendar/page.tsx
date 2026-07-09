import { db } from "@/db";
import { tasks, projects } from "@/db/schema";
import { CalendarClient } from "./client";

export default async function CalendarPage() {
  const [allTasks, allProjects] = await Promise.all([
    db.select().from(tasks),
    db.select().from(projects),
  ]);

  return (
    <CalendarClient
      initialTasks={allTasks.map(t => ({
        id: t.id,
        title: t.title,
        projectId: t.projectId,
        blockType: t.blockType,
        dueDate: t.dueDate,
        startTime: t.startTime,
        endTime: t.endTime,
        completed: t.completed,
      }))}
      projects={allProjects.map(p => ({ id: p.id, name: p.name }))}
    />
  );
}
