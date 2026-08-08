import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://medclinik_user:medclinik_password@localhost:5434/medclinik_db?schema=public';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Début du backfill rétroactif des factures PAID...');

  const paidBills = await prisma.billing.findMany({
    where: {
      status: 'PAID',
      amountPaid: 0,
    },
  });

  console.log(`Nombre de factures à mettre à jour : ${paidBills.length}`);

  let updatedCount = 0;
  for (const bill of paidBills) {
    await prisma.billing.update({
      where: { id: bill.id },
      data: { amountPaid: bill.patientShare },
    });
    updatedCount++;
  }

  console.log(`Succès : ${updatedCount} factures mises à jour avec amountPaid = patientShare.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Erreur lors du backfill :', err);
  process.exit(1);
});
