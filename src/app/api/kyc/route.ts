import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import {
  getSessionOrUnauthorized,
  getClientIP,
  logAudit,
  checkApiRateLimit,
  internalServerError,
} from '@/lib/api-helpers'
import { hasPermission } from '@/types'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 Mo par pièce
const TYPES_DOC = ['CNI', 'PASSEPORT', 'PERMIS']

async function saveFile(userId: string, prefix: string, file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const dir = join(process.cwd(), 'uploads', 'kyc', userId)
  await mkdir(dir, { recursive: true })
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${Date.now()}-${prefix}.${ext}`
  await writeFile(join(dir, filename), buffer)
  return `/api/uploads/kyc/${userId}/${filename}`
}

// POST : l'utilisateur soumet (ou re-soumet) sa demande de vérification KYC.
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionOrUnauthorized()
    if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

    const rateRes = await checkApiRateLimit(req)
    if (rateRes) return rateRes

    const { user } = session

    const existing = await prisma.demandeKYC.findUnique({ where: { utilisateurId: user.id } })
    if (existing && existing.statut === 'VALIDE') {
      return NextResponse.json({ error: 'Votre compte est déjà vérifié.' }, { status: 409 })
    }

    const form = await req.formData()
    const typeDocument = String(form.get('typeDocument') ?? '')
    const numeroDocument = String(form.get('numeroDocument') ?? '').trim()
    const recto = form.get('recto') as File | null
    const verso = form.get('verso') as File | null
    const selfie = form.get('selfie') as File | null

    if (!TYPES_DOC.includes(typeDocument)) {
      return NextResponse.json({ error: 'Type de document invalide.' }, { status: 400 })
    }
    if (!numeroDocument) {
      return NextResponse.json({ error: 'Numéro de document requis.' }, { status: 400 })
    }
    if (!recto || !selfie) {
      return NextResponse.json({ error: 'Recto et selfie requis.' }, { status: 400 })
    }

    for (const f of [recto, verso, selfie]) {
      if (!f) continue
      if (!ALLOWED_MIME.includes(f.type)) {
        return NextResponse.json(
          { error: `Format ${f.type || 'inconnu'} non supporté. Utilisez JPEG, PNG ou WebP.` },
          { status: 400 }
        )
      }
      if (f.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Image trop volumineuse (max 10 Mo).' }, { status: 400 })
      }
    }

    const rectoUrl = await saveFile(user.id, 'recto', recto)
    const versoUrl = verso ? await saveFile(user.id, 'verso', verso) : null
    const selfieUrl = await saveFile(user.id, 'selfie', selfie)

    const demande = await prisma.demandeKYC.upsert({
      where: { utilisateurId: user.id },
      create: {
        utilisateurId: user.id,
        typeDocument,
        numeroDocument,
        rectoUrl,
        versoUrl,
        selfieUrl,
        statut: 'EN_ATTENTE',
      },
      update: {
        typeDocument,
        numeroDocument,
        rectoUrl,
        versoUrl,
        selfieUrl,
        statut: 'EN_ATTENTE',
        motifRejet: null,
        traiteParId: null,
        dateTraitement: null,
      },
    })

    await logAudit({
      utilisateurId: user.id,
      action: 'SOUMISSION_KYC',
      entite: 'DemandeKYC',
      entiteId: demande.id,
      adresseIP: getClientIP(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ id: demande.id, statut: demande.statut }, { status: 201 })
  } catch (err) {
    console.error('Erreur KYC POST:', err)
    const detail = err instanceof Error ? err.message : 'Erreur inconnue.'
    return NextResponse.json(
      { error: `Échec de l'envoi du KYC : ${detail}` },
      { status: 500 }
    )
  }
}

// GET : file d'attente des demandes (validateur KYC / admin). ?statut=EN_ATTENTE par défaut.
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionOrUnauthorized()
    if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

    const rateRes = await checkApiRateLimit(req)
    if (rateRes) return rateRes

    const role = session.user.role as Role
    if (role !== Role.ADMINISTRATEUR && !hasPermission(role, 'COMPTE_VALIDER')) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const statut = new URL(req.url).searchParams.get('statut') ?? 'EN_ATTENTE'
    const where =
      statut === 'TOUTES' ? {} : { statut: statut as 'EN_ATTENTE' | 'VALIDE' | 'REJETE' }

    const demandes = await prisma.demandeKYC.findMany({
      where,
      include: {
        utilisateur: { select: { id: true, nom: true, prenom: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    })

    return NextResponse.json(demandes)
  } catch (err) {
    console.error('Erreur KYC GET:', err)
    return internalServerError()
  }
}
