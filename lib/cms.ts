import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  SITE as DEFAULT_SITE,
  EXTERIOR_IMAGES as DEFAULT_EXTERIOR_IMAGES,
  ROOMS as DEFAULT_ROOMS,
  PRICING as DEFAULT_PRICING,
  SERVICES as DEFAULT_SERVICES,
  GALLERY_IMAGES as DEFAULT_GALLERY_IMAGES,
  RESTAURANT_PHOTOS as DEFAULT_RESTAURANT_PHOTOS,
  SHOP_CATEGORIES as DEFAULT_SHOP_CATEGORIES,
  FAQ as DEFAULT_FAQ,
  AVAILABILITY as DEFAULT_AVAILABILITY,
  type Room,
  type ServiceItem,
  type RestaurantPhoto,
  type SiteInfo,
  type ExteriorImages,
  type Pricing,
  type ShopCategory,
  type Faq,
  type Availability,
} from "@/lib/content";

// Re-export the NAV_LINKS untouched — navigation isn't admin-editable content.
export { NAV_LINKS } from "@/lib/content";
export type {
  Room,
  ServiceItem,
  RestaurantPhoto,
  SiteInfo,
  ExteriorImages,
  Pricing,
  ShopCategory,
  Faq,
  Availability,
};

async function getContent<T>(key: string, fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_content").select("value").eq("key", key).single();
    if (error || !data) return fallback;
    return data.value as T;
  } catch {
    return fallback;
  }
}

export const getSite = () => getContent<SiteInfo>("site", DEFAULT_SITE);
export const getExteriorImages = () => getContent<ExteriorImages>("exterior_images", DEFAULT_EXTERIOR_IMAGES);
export const getRooms = () => getContent<Room[]>("rooms", DEFAULT_ROOMS);
export const getPricing = () => getContent<Pricing>("pricing", DEFAULT_PRICING);
export const getServices = () => getContent<ServiceItem[]>("services", DEFAULT_SERVICES);
export const getGalleryImages = () => getContent<string[]>("gallery_images", DEFAULT_GALLERY_IMAGES);
export const getRestaurantPhotos = () =>
  getContent<RestaurantPhoto[]>("restaurant_photos", DEFAULT_RESTAURANT_PHOTOS);
export const getShopCategories = () => getContent<ShopCategory[]>("shop_categories", DEFAULT_SHOP_CATEGORIES);
export const getFaq = () => getContent<Faq>("faq", DEFAULT_FAQ);
export const getAvailability = () => getContent<Availability>("availability", DEFAULT_AVAILABILITY);

// Every content key + its default, used by the admin panel to seed a
// section the first time it's opened (before anything's been saved).
export const CONTENT_DEFAULTS = {
  site: DEFAULT_SITE,
  exterior_images: DEFAULT_EXTERIOR_IMAGES,
  rooms: DEFAULT_ROOMS,
  pricing: DEFAULT_PRICING,
  services: DEFAULT_SERVICES,
  gallery_images: DEFAULT_GALLERY_IMAGES,
  restaurant_photos: DEFAULT_RESTAURANT_PHOTOS,
  shop_categories: DEFAULT_SHOP_CATEGORIES,
  faq: DEFAULT_FAQ,
  availability: DEFAULT_AVAILABILITY,
} as const;

export type ContentKey = keyof typeof CONTENT_DEFAULTS;
