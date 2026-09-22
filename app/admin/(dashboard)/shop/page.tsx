import { getShopCategories } from "@/lib/cms";
import ShopEditor from "@/components/admin/ShopEditor";

export default async function AdminShopPage() {
  const categories = await getShopCategories();
  return <ShopEditor initial={categories} />;
}
