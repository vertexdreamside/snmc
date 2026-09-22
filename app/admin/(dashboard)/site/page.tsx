import { getSite } from "@/lib/cms";
import SiteEditor from "@/components/admin/SiteEditor";

export default async function AdminSitePage() {
  const site = await getSite();
  return <SiteEditor initial={site} />;
}
