import CatalogueDetail from "@/components/catalogue/CatalogueDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DashboardAuctionDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <CatalogueDetail
      id={id}
      backHref="/dashboard/catalogue"
      ctaHref={`/dashboard/encheres/${id}`}
      ctaLabel="Enchérir"
    />
  );
}
