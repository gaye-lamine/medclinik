import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const email = 'lifesonou@gmail.com';
  // Use the full international format so that the SMS OTP works correctly
  const phone = '+221772238013'; 

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log(`User ${email} already exists. Updating...`);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        phone: phone,
        role: 'ADMIN',
        name: 'Administrateur Principal'
      }
    });
    console.log('User updated successfully.');
  } else {
    console.log(`Creating user ${email}...`);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Administrateur Principal',
        role: 'ADMIN',
        phone: phone,
      },
    });
    console.log('Admin user created successfully!');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
