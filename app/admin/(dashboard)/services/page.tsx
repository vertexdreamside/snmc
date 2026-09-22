import { getServices } from "@/lib/cms";
import ServicesEditor from "@/components/admin/ServicesEditor";

export default async function AdminServicesPage() {
  const services = await getServices();
  return <ServicesEditor initial={services} />;
}
