import { getGalleryImages } from "@/lib/cms";
import GalleryEditor from "@/components/admin/GalleryEditor";

export default async function AdminGalleryPage() {
  const images = await getGalleryImages();
  return <GalleryEditor initial={images} />;
}
