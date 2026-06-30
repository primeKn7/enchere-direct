import CatalogueContent from "@/components/catalogue/CatalogueContent";
import { getPublishedAuctions } from "@/lib/catalogue";

// Toujours rendu dynamiquement : le catalogue reflète les lots publiés en base.
export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const auctions = await getPublishedAuctions();

  return (
    <main className="py-24 min-h-screen" style={{ background: "var(--surface-base)" }}>
      <div className="container-app">
        <CatalogueContent basePath="/catalogue" auctions={auctions} />
      </div>
    </main>
  );
}
