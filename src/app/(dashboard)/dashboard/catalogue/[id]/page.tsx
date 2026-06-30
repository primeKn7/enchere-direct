import CatalogueDetail from "@/components/catalogue/CatalogueDetail";
import { getPublishedAuctionById } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DashboardAuctionDetailPage({ params }: Props) {
  const { id } = await params;
  const auction = (await getPublishedAuctionById(id)) ?? undefined;

  return (
    <CatalogueDetail
      id={id}
      auction={auction}
      backHref="/dashboard/catalogue"
      interactiveBid
    />
  );
}
