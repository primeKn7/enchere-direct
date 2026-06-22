import 'dotenv/config'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/security'

async function main() {
  const [email, newPassword] = process.argv.slice(2)

  if (!email || !newPassword) {
    console.error('Usage: npx tsx scripts/reset-password.ts <email> <nouveau-mot-de-passe>')
    process.exit(1)
  }

  const user = await prisma.utilisateur.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user) {
    console.error(`Utilisateur non trouvé: ${email}`)
    process.exit(1)
  }

  const hash = await hashPassword(newPassword)

  await prisma.utilisateur.update({
    where: { id: user.id },
    data: {
      motDePasseHash: hash,
      tentativesEchec: 0,
      compteBloque: false,
    },
  })

  console.log(`Mot de passe réinitialisé pour ${user.email}`)
  console.log(`Nouveau hash: ${hash.slice(0, 20)}...`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
