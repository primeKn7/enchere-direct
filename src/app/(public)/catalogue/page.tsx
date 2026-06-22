import CatalogueContent from "@/components/catalogue/CatalogueContent";

export default function CatalogPage() {
  return (
    <main className="py-24 min-h-screen" style={{ background: "var(--surface-base)" }}>
      <div className="container-app">
        <CatalogueContent basePath="/catalogue" />
      </div>
    </main>
  );
}
