import CatalogueDetail from "@/components/catalogue/CatalogueDetail";
import { getPublishedAuctionById } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AuctionDetailPage({ params }: Props) {
  const { id } = await params;
  const auction = (await getPublishedAuctionById(id)) ?? undefined;

  return (
    <main className="py-24 min-h-screen" style={{ background: "var(--surface-base)" }}>
      <div className="container-app">
        <CatalogueDetail
          id={id}
          auction={auction}
          backHref="/catalogue"
          ctaHref="/login"
          ctaLabel="Se connecter pour enchérir"
        />
      </div>
    </main>
  );
}
