import { getAvailability, getRooms } from "@/lib/cms";
import AvailabilityEditor from "@/components/admin/AvailabilityEditor";

export default async function AdminAvailabilityPage() {
  const [availability, rooms] = await Promise.all([getAvailability(), getRooms()]);
  return <AvailabilityEditor initial={availability} rooms={rooms} />;
}
