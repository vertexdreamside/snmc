import { getFaq } from "@/lib/cms";
import FaqEditor from "@/components/admin/FaqEditor";

export default async function AdminFaqPage() {
  const faq = await getFaq();
  return <FaqEditor initial={faq} />;
}
