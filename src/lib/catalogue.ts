import { prisma } from "@/lib/prisma";
import type { DemoAuction } from "@/components/marketing/AuctionCard";
import { syncEncheresStatuts } from "@/lib/enchere-statut";

const CATEGORY_KEYS = [
  "vehicules",
  "immobilier",
  "bijoux",
  "art",
  "electronique",
  "meubles",
  "machines",
  "autres",
];

const CATEGORY_LABELS: Record<string, string> = {
  vehicules: "Véhicules",
  immobilier: "Immobilier",
  bijoux: "Bijoux / Or",
  art: "Art / Antiquités",
  electronique: "Électronique",
  meubles: "Meubles",
  machines: "Machines",
  autres: "Autres",
};

function normalize(str: string) {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Rapproche une catégorie libre saisie en inventaire d'une clé de filtre du catalogue.
function toCategoryKey(categorie: string): string {
  const n = normalize(categorie);
  const direct = CATEGORY_KEYS.find((k) => n.includes(k.replace("s", "")));
  if (direct) return direct;
  if (/(voiture|camion|moto|auto|vehicul)/.test(n)) return "vehicules";
  if (/(maison|appartement|terrain|immeuble|immobil)/.test(n)) return "immobilier";
  if (/(bijou|or |or$|montre|diamant)/.test(n)) return "bijoux";
  if (/(tableau|peinture|sculpture|antiqu|oeuvre)/.test(n)) return "art";
  if (/(ordinateur|telephone|electro|tv|informatique)/.test(n)) return "electronique";
  if (/(meuble|canape|table|chaise)/.test(n)) return "meubles";
  if (/(machine|groupe|industriel|moteur)/.test(n)) return "machines";
  return "autres";
}

function timeOf(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}h${String(date.getMinutes()).padStart(2, "0")}`;
}

// Forme commune des lots inclus (liste + détail).
const lotInclude = {
  bien: {
    include: {
      medias: { where: { type: "PHOTO" }, select: { url: true } },
      dossier: { select: { jurisdictionCompetente: true } },
    },
  },
  enchere: {
    select: {
      montantActuel: true,
      dateDebut: true,
      dateFin: true,
      statut: true,
    },
  },
} as const;

type LotWithRels = {
  id: string;
  numeroLot: string;
  prixDepart: unknown;
  bien: {
    categorie: string;
    sousCategorie: string | null;
    description: string;
    etatGeneral: string;
    localisation: string;
    medias: { url: string }[];
    dossier: { jurisdictionCompetente: string };
  };
  enchere: {
    montantActuel: unknown;
    dateDebut: Date;
    dateFin: Date;
    statut: string;
  } | null;
};

function mapLot(lot: LotWithRels): DemoAuction {
  const bien = lot.bien;
  const enchere = lot.enchere;
  const categoryKey = toCategoryKey(bien.categorie);
  const now = Date.now();

  let status: DemoAuction["status"] = "upcoming";
  if (enchere) {
    const debut = enchere.dateDebut.getTime();
    const fin = enchere.dateFin.getTime();
    if (now > fin || enchere.statut === "CLOTUREE" || enchere.statut === "ANNULEE") {
      status = "ended";
    } else if (now >= debut) {
      status = "active";
    } else {
      status = "upcoming";
    }
  }

  const title = bien.sousCategorie
    ? `${bien.categorie} — ${bien.sousCategorie}`
    : bien.categorie;

  return {
    id: lot.id,
    title,
    description: bien.description,
    images: bien.medias.map((m) => m.url),
    startingPrice: Number(lot.prixDepart),
    currentPrice: enchere ? Number(enchere.montantActuel) : Number(lot.prixDepart),
    currency: "XOF",
    category: CATEGORY_LABELS[categoryKey],
    categoryKey,
    // Le modèle de données ne stocke pas le pays : on laisse vide (filtre pays
    // sans effet pour les vrais lots tant qu'un champ pays n'est pas ajouté).
    country: bien.dossier.jurisdictionCompetente,
    countryKey: "",
    type: "judiciaire",
    status,
    endDate: enchere ? enchere.dateFin.toISOString() : "",
    scheduleDate: enchere ? enchere.dateDebut.toISOString().slice(0, 10) : "",
    liveTime: enchere ? timeOf(enchere.dateDebut) : "",
    sellerName: bien.dossier.jurisdictionCompetente,
    condition: bien.etatGeneral,
    location: bien.localisation,
    lotNumber: lot.numeroLot,
    nonProgramme: !enchere,
  };
}

/**
 * Charge les lots publiés et les transforme dans la forme attendue par le
 * catalogue public (DemoAuction). Renvoie un tableau vide s'il n'y a aucun lot.
 */
export async function getPublishedAuctions(): Promise<DemoAuction[]> {
  await syncEncheresStatuts();
  const lots = await prisma.lot.findMany({
    where: { publie: true },
    include: lotInclude,
    orderBy: { createdAt: "desc" },
  });
  return lots.map((lot) => mapLot(lot as unknown as LotWithRels));
}

/** Charge un lot publié par son id, ou null s'il n'existe pas / n'est pas publié. */
export async function getPublishedAuctionById(id: string): Promise<DemoAuction | null> {
  await syncEncheresStatuts();
  const lot = await prisma.lot.findFirst({
    where: { id, publie: true },
    include: lotInclude,
  });
  return lot ? mapLot(lot as unknown as LotWithRels) : null;
}
