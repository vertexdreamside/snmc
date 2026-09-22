import { getRestaurantPhotos } from "@/lib/cms";
import RestaurantEditor from "@/components/admin/RestaurantEditor";

export default async function AdminRestaurantPage() {
  const photos = await getRestaurantPhotos();
  return <RestaurantEditor initial={photos} />;
}
