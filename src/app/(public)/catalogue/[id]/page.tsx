import CatalogueDetail from "@/components/catalogue/CatalogueDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AuctionDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="py-24 min-h-screen" style={{ background: "var(--surface-base)" }}>
      <div className="container-app">
        <CatalogueDetail
          id={id}
          backHref="/catalogue"
          ctaHref="/login"
          ctaLabel="Se connecter pour enchérir"
        />
      </div>
    </main>
  );
}
