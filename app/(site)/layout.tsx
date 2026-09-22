import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getSite } from "@/lib/cms";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();
  return (
    <>
      <Loader site={site} />
      <Header site={site} />
      {children}
      <Footer site={site} />
      <WhatsAppButton site={site} />
    </>
  );
}
