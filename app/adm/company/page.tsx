import { getCompany } from "@/lib/actions/company";
import { CompanyClient } from "./client";

export default async function CompanyPage() {
  const company = await getCompany();

  return <CompanyClient company={company} />;
}
