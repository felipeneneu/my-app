import { DashboardClient } from "./client";

export default async function HomePage(props: { searchParams: Promise<{ newProject?: string }> }) {
  const { newProject } = await props.searchParams;
  return <DashboardClient autoOpenProject={!!newProject} />;
}
