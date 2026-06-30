"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldOff,
  BadgeCheck,
  KeyRound,
  RefreshCw,
  Calendar,
} from "lucide-react";
import CreateUserForm from "./CreateUserForm";

type Utilisateur = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  compteVerifie: boolean;
  compteBloque: boolean;
  mfaActif: boolean;
  tentativesEchec: number;
  derniereConnexion: string | null;
  createdAt: string;
};

const roleLabels: Record<string, string> = {
  CITOYEN: "Citoyen",
  ENTREPRISE: "Entreprise",
  COMMISSAIRE_PRISEUR: "Commissaire-Priseur",
  AGENT_AES: "Agent AES",
  MAGISTRAT: "Magistrat",
  DOUANIER: "Douanier",
  TRESOR_PUBLIC: "Trésor Public",
  EXPERT: "Expert",
  ADMINISTRATEUR: "Administrateur",
};

export default function UtilisateursPage() {
  const { data: session, status } = useSession();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated" && session?.user?.role !== "ADMINISTRATEUR") {
      redirect("/dashboard");
    }
    if (status === "authenticated") fetchUtilisateurs();
  }, [status, roleFilter]);

  async function fetchUtilisateurs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (search) params.set("q", search);
      const res = await fetch(`/api/utilisateurs?${params}`);
      if (res.ok) setUtilisateurs(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: string) {
    setProcessing(id);
    setMessage(null);
    try {
      const res = await fetch("/api/utilisateurs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        const labels: Record<string, string> = {
          bloquer: "Utilisateur bloqué.",
          debloquer: "Utilisateur débloqué.",
          verifier: "Compte vérifié.",
          resetMfa: "MFA réinitialisé.",
        };
        setMessage({ type: "success", text: labels[action] ?? "Action effectuée." });
        fetchUtilisateurs();
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error ?? "Erreur." });
      }
    } finally {
      setProcessing(null);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchUtilisateurs();
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-[var(--accent)]" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Users size={28} className="text-[var(--accent)]" />
        <h1 className="text-[var(--ink)]">Gestion des utilisateurs</h1>
      </div>

      {message && (
        <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"} mb-6`}>
          {message.text}
        </div>
      )}

      <CreateUserForm
        onCreated={() => {
          setMessage({ type: "success", text: "Utilisateur créé." });
          fetchUtilisateurs();
        }}
      />

      <div className="glass-surface p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={18} className="text-[var(--ink-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="input flex-1"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">Tous les rôles</option>
            {Object.entries(roleLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary">Filtrer</button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-[var(--accent)]" size={24} />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>MFA</th>
                <th>Inscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-[var(--ink)]">
                    {u.prenom} {u.nom}
                  </td>
                  <td className="text-sm">{u.email}</td>
                  <td>
                    <span className="badge badge-subtle">{roleLabels[u.role] ?? u.role}</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      {u.compteBloque && <span className="badge badge-danger">Bloqué</span>}
                      {u.compteVerifie ? (
                        <span className="badge badge-success">Vérifié</span>
                      ) : (
                        <span className="badge badge-warning">Non vérifié</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.mfaActif ? "badge-success" : "badge-subtle"}`}>
                      {u.mfaActif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td>
                    <span className="flex items-center gap-1 text-sm">
                      <Calendar size={14} />
                      {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {u.compteBloque ? (
                        <button
                          onClick={() => handleAction(u.id, "debloquer")}
                          disabled={processing === u.id}
                          className="btn-ghost text-xs py-1 px-2"
                          title="Débloquer"
                        >
                          <ShieldCheck size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(u.id, "bloquer")}
                          disabled={processing === u.id}
                          className="btn-ghost text-xs py-1 px-2"
                          title="Bloquer"
                        >
                          <ShieldOff size={14} />
                        </button>
                      )}
                      {!u.compteVerifie && (
                        <button
                          onClick={() => handleAction(u.id, "verifier")}
                          disabled={processing === u.id}
                          className="btn-ghost text-xs py-1 px-2"
                          title="Vérifier"
                        >
                          <BadgeCheck size={14} />
                        </button>
                      )}
                      {u.mfaActif && (
                        <button
                          onClick={() => handleAction(u.id, "resetMfa")}
                          disabled={processing === u.id}
                          className="btn-ghost text-xs py-1 px-2"
                          title="Reset MFA"
                        >
                          <KeyRound size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-[var(--ink-muted)] mt-4">
        {utilisateurs.length} utilisateur{utilisateurs.length > 1 ? "s" : ""} affiché{utilisateurs.length > 1 ? "s" : ""}
      </p>
    </div>
  );
}
