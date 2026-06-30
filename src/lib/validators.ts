import { z } from 'zod'
import { Role, TypeEnchere, StatutDossier } from '@prisma/client'

const decimalLike = z.union([
  z.number().positive(),
  z.string().regex(/^\d+(\.\d{1,2})?$/, 'Montant invalide'),
])

export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide.').max(255),
  password: z.string().min(1, 'Le mot de passe est requis.').max(255),
})

export const registerSchema = z
  .object({
    email: z.string().email('Adresse email invalide.').max(255),
    password: z
      .string()
      .min(12, 'Le mot de passe doit contenir au moins 12 caractères.')
      .max(128)
      .regex(/[A-Z]/, 'Au moins une majuscule.')
      .regex(/[a-z]/, 'Au moins une minuscule.')
      .regex(/[0-9]/, 'Au moins un chiffre.')
      .regex(/[!@#$%^&*(),.?":{}|<>_\-=+\[\]\\/;'`~]/, 'Au moins un caractère spécial.'),
    nom: z.string().min(2, 'Le nom est requis.').max(100),
    prenom: z.string().min(2, 'Le prénom est requis.').max(100),
    telephone: z.string().max(20).optional(),
    role: z.nativeEnum(Role),
    // Champs spécifiques selon le rôle
    numeroCNI: z.string().max(50).optional(),
    numeroRCCM: z.string().max(50).optional(),
    raisonSociale: z.string().max(200).optional(),
    numeroAgrement: z.string().max(50).optional(),
    jurisdiction: z.string().max(200).optional(),
    posteAffectation: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    // Sécurité : l'inscription publique est strictement limitée aux rôles grand public.
    // Les rôles internes (agent, magistrat, expert, commissaire, admin…) ne peuvent
    // être créés que par un administrateur.
    if (data.role !== Role.CITOYEN && data.role !== Role.ENTREPRISE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ce rôle ne peut pas être créé via l'inscription.",
        path: ['role'],
      })
    }
    if (data.role === Role.CITOYEN && !data.numeroCNI) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Numéro CNI requis.', path: ['numeroCNI'] })
    }
    if (data.role === Role.ENTREPRISE && (!data.numeroRCCM || !data.raisonSociale)) {
      if (!data.numeroRCCM) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Numéro RCCM requis.', path: ['numeroRCCM'] })
      if (!data.raisonSociale) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Raison sociale requise.', path: ['raisonSociale'] })
    }
    if (data.role === Role.COMMISSAIRE_PRISEUR && !data.numeroAgrement) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Numéro d'agrément requis.", path: ['numeroAgrement'] })
    }
    if (data.role === Role.EXPERT && !data.numeroAgrement) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Numéro d'agrément expert requis.", path: ['numeroAgrement'] })
    }
    if (data.role === Role.MAGISTRAT && !data.jurisdiction) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Juridiction compétente requise.', path: ['jurisdiction'] })
    }
    if (data.role === Role.DOUANIER && !data.posteAffectation) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Poste affectation requis.', path: ['posteAffectation'] })
    }
  })

// Création d'un utilisateur par un administrateur : mêmes règles que l'inscription,
// mais l'admin choisit le rôle et peut marquer le compte comme vérifié d'emblée.
export const adminCreateUserSchema = z
  .object({
    email: z.string().email('Adresse email invalide.').max(255),
    password: z
      .string()
      .min(12, 'Le mot de passe doit contenir au moins 12 caractères.')
      .max(128)
      .regex(/[A-Z]/, 'Au moins une majuscule.')
      .regex(/[a-z]/, 'Au moins une minuscule.')
      .regex(/[0-9]/, 'Au moins un chiffre.')
      .regex(/[!@#$%^&*(),.?":{}|<>_\-=+\[\]\\/;'`~]/, 'Au moins un caractère spécial.'),
    nom: z.string().min(2, 'Le nom est requis.').max(100),
    prenom: z.string().min(2, 'Le prénom est requis.').max(100),
    telephone: z.string().max(20).optional(),
    role: z.nativeEnum(Role),
    numeroCNI: z.string().max(50).optional(),
    numeroRCCM: z.string().max(50).optional(),
    raisonSociale: z.string().max(200).optional(),
    numeroAgrement: z.string().max(50).optional(),
    jurisdiction: z.string().max(200).optional(),
    posteAffectation: z.string().max(200).optional(),
    compteVerifie: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === Role.ENTREPRISE && !data.raisonSociale) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Raison sociale requise.', path: ['raisonSociale'] })
    }
    if ((data.role === Role.COMMISSAIRE_PRISEUR || data.role === Role.EXPERT) && !data.numeroAgrement) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Numéro d'agrément requis.", path: ['numeroAgrement'] })
    }
    if (data.role === Role.MAGISTRAT && !data.jurisdiction) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Juridiction compétente requise.', path: ['jurisdiction'] })
    }
    if (data.role === Role.DOUANIER && !data.posteAffectation) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Poste affectation requis.', path: ['posteAffectation'] })
    }
  })

export const offreSchema = z.object({
  montant: decimalLike,
  surenchereAuto: z
    .object({
      plafondMaximal: decimalLike,
      increment: decimalLike,
    })
    .optional(),
})

export const dossierSaisieSchema = z.object({
  referenceJudiciaire: z.string().min(3).max(100),
  jurisdictionCompetente: z.string().min(2).max(200),
  dateSaisie: z.string().datetime({ message: 'Date ISO 8601 requise.' }),
  identiteProprietaire: z.string().min(2, 'Identité du propriétaire requise.').max(300),
  creancier: z.string().min(2, 'Créancier requis.').max(300),
  huissierInstrumentaire: z.string().min(2, 'Huissier instrumentaire requis.').max(300),
  magistratId: z.string().uuid().optional(),
})

export const enchereCreateSchema = z.object({
  lotId: z.string().uuid(),
  type: z.nativeEnum(TypeEnchere),
  dateDebut: z.string().datetime(),
  dateFin: z.string().datetime(),
  montantReserve: decimalLike,
  pourcentageGarantie: z.number().min(0).max(100).default(10),
  antiSnipingDelai: z.number().int().min(0).default(120),
})

export const updateDossierSchema = z.object({
  statut: z.nativeEnum(StatutDossier),
})

export const bienSaisiSchema = z.object({
  dossierId: z.string().uuid('ID de dossier invalide.'),
  categorie: z.string().min(2, 'Catégorie requise.').max(100),
  sousCategorie: z.string().max(100).optional(),
  description: z.string().min(10, 'Description trop courte (min 10 caractères).').max(5000),
  valeurEstimee: decimalLike,
  localisation: z.string().min(2, 'Localisation requise.').max(500),
  etatGeneral: z.string().min(2, 'État général requis.').max(200),
  rfid: z.string().max(100).optional(),
})

export const updateBienSchema = z.object({
  categorie: z.string().min(2).max(100).optional(),
  sousCategorie: z.string().max(100).optional(),
  description: z.string().min(10).max(5000).optional(),
  valeurEstimee: decimalLike.optional(),
  localisation: z.string().min(2).max(500).optional(),
  etatGeneral: z.string().min(2).max(200).optional(),
  rfid: z.string().max(100).optional(),
})

export const affectationSchema = z.object({
  bienId: z.string().uuid('Bien invalide.'),
  expertId: z.string().uuid('Expert invalide.'),
  dateLimite: z.string().datetime({ message: 'Date ISO 8601 requise.' }).optional(),
  consigne: z.string().max(2000).optional(),
})

export const rapportExpertiseSchema = z.object({
  valeurEstimee: decimalLike,
  methodologie: z.string().max(2000).optional(),
  contenu: z.string().min(20, 'Le rapport doit contenir au moins 20 caractères.').max(20000),
})

export const validationRapportSchema = z
  .object({
    decision: z.enum(['VALIDE', 'REJETE']),
    motifRejet: z.string().max(2000).optional(),
    note: z.number().int().min(1).max(5).optional(),
    commentaire: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === 'REJETE' && !data.motifRejet?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Motif de rejet requis.', path: ['motifRejet'] })
    }
    if (data.decision === 'VALIDE' && data.note === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Note de l'expert requise (1 à 5).", path: ['note'] })
    }
  })

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Le code doit comporter 6 chiffres.').regex(/^\d+$/),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type OffreInput = z.infer<typeof offreSchema>
export type DossierSaisieInput = z.infer<typeof dossierSaisieSchema>
export type BienSaisiInput = z.infer<typeof bienSaisiSchema>
export type AffectationInput = z.infer<typeof affectationSchema>
export type RapportExpertiseInput = z.infer<typeof rapportExpertiseSchema>
export type ValidationRapportInput = z.infer<typeof validationRapportSchema>
