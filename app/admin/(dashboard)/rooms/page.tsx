import { getRooms } from "@/lib/cms";
import RoomsEditor from "@/components/admin/RoomsEditor";

export default async function AdminRoomsPage() {
  const rooms = await getRooms();
  return <RoomsEditor initial={rooms} />;
}
