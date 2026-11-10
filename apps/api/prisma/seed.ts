import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@coffein.id";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin12345";
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin Coffein",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  // Kategori
  const kopi = await prisma.category.upsert({
    where: { slug: "kopi" },
    update: {},
    create: { name: "Kopi", slug: "kopi" },
  });
  const nonKopi = await prisma.category.upsert({
    where: { slug: "non-kopi" },
    update: {},
    create: { name: "Non-Kopi", slug: "non-kopi" },
  });
  const pastry = await prisma.category.upsert({
    where: { slug: "pastry" },
    update: {},
    create: { name: "Pastry", slug: "pastry" },
  });

  // Produk contoh
  const products = [
    {
      name: "Kopi Susu Gula Aren",
      description: "Espresso, susu segar, dan gula aren cair.",
      price: 22000,
      categoryId: kopi.id,
    },
    {
      name: "Americano",
      description: "Espresso double shot dengan air panas.",
      price: 18000,
      categoryId: kopi.id,
    },
    {
      name: "Cappuccino",
      description: "Espresso, susu steamed, foam tebal.",
      price: 25000,
      categoryId: kopi.id,
    },
    {
      name: "Matcha Latte",
      description: "Matcha premium diseduh dengan susu.",
      price: 26000,
      categoryId: nonKopi.id,
    },
    {
      name: "Dark Chocolate",
      description: "Cokelat pekat 70% dengan susu.",
      price: 24000,
      categoryId: nonKopi.id,
    },
    {
      name: "Butter Croissant",
      description: "Croissant renyah dengan butter premium.",
      price: 20000,
      categoryId: pastry.id,
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
    }
  }

  console.log("Seed selesai: admin + 3 kategori + 6 produk.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
