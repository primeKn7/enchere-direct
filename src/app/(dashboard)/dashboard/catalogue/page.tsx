import CatalogueContent from "@/components/catalogue/CatalogueContent";
import { getPublishedAuctions } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export default async function DashboardCataloguePage() {
  const auctions = await getPublishedAuctions();
  return <CatalogueContent basePath="/dashboard/catalogue" auctions={auctions} />;
}
