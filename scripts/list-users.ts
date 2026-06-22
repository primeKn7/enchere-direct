import 'dotenv/config'
import { prisma } from '@/lib/prisma'

async function main() {
  const users = await prisma.utilisateur.findMany({
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
      compteVerifie: true,
      compteBloque: true,
      mfaActif: true,
      tentativesEchec: true,
      derniereConnexion: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  console.log(`\n${users.length} utilisateur(s) trouvé(s):\n`)
  for (const u of users) {
    console.log(`- ${u.email}`)
    console.log(`  ID:        ${u.id}`)
    console.log(`  Nom:       ${u.prenom} ${u.nom}`)
    console.log(`  Rôle:      ${u.role}`)
    console.log(`  Vérifié:   ${u.compteVerifie}`)
    console.log(`  Bloqué:    ${u.compteBloque}`)
    console.log(`  MFA:       ${u.mfaActif}`)
    console.log(`  Échecs:    ${u.tentativesEchec}`)
    console.log(`  Créé le:   ${u.createdAt.toISOString()}`)
    console.log(`  Dernière:  ${u.derniereConnexion?.toISOString() ?? 'jamais'}`)
    console.log('')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
