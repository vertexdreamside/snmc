import { getPricing } from "@/lib/cms";
import PricingEditor from "@/components/admin/PricingEditor";

export default async function AdminPricingPage() {
  const pricing = await getPricing();
  return <PricingEditor initial={pricing} />;
}
