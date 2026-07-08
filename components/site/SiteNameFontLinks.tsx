import { getSiteNameFontOption, type SiteNameFontKey } from "@/lib/site-name-fonts";

export function SiteNameFontLinks({ fontKey }: { fontKey: SiteNameFontKey }) {
  const { googleHref } = getSiteNameFontOption(fontKey);
  if (!googleHref) return null;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={googleHref} />
    </>
  );
}
