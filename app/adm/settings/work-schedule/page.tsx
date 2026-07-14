import { getWorkSchedule } from "@/lib/actions/work-schedule";
import { WorkScheduleClient } from "./client";

export default async function WorkSchedulePage() {
  const result = await getWorkSchedule();
  const schedule = result.success ? result.data : [];
  return <WorkScheduleClient initialSchedule={schedule} />;
}
