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
    if (data.role === Role.MAGISTRAT && !data.jurisdiction) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Juridiction compétente requise.', path: ['jurisdiction'] })
    }
    if (data.role === Role.DOUANIER && !data.posteAffectation) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Poste affectation requis.', path: ['posteAffectation'] })
    }
  })

export const offreSchema = z.object({
  montant: decimalLike,
})

export const dossierSaisieSchema = z.object({
  referenceJudiciaire: z.string().min(3).max(100),
  jurisdictionCompetente: z.string().min(2).max(200),
  dateSaisie: z.string().datetime({ message: 'Date ISO 8601 requise.' }),
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

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Le code doit comporter 6 chiffres.').regex(/^\d+$/),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type OffreInput = z.infer<typeof offreSchema>
export type DossierSaisieInput = z.infer<typeof dossierSaisieSchema>
