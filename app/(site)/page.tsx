import { HomePopupBanners } from "@/components/site/HomePopupBanners";
import { PrimeaxHomeLanding } from "@/components/site/PrimeaxHomeLanding";
import { listActiveSiteBanners } from "@/lib/site-banners";
import { getPublicHomeContent } from "@/lib/site-homepage";

export default async function HomePage() {
  const [popupBanners, publicHome] = await Promise.all([
    listActiveSiteBanners("popup"),
    getPublicHomeContent(),
  ]);

  return (
    <main>
      {popupBanners.length > 0 ? <HomePopupBanners banners={popupBanners} /> : null}
      <PrimeaxHomeLanding content={publicHome} />
    </main>
  );
}
