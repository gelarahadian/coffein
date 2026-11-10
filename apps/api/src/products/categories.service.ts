import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      include: { products: true },
      orderBy: { name: "asc" },
    });
  }

  create(name: string) {
    return this.prisma.category.create({
      data: { name, slug: slugify(name) },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException("Kategori tidak ditemukan");
    }
    await this.prisma.category.delete({ where: { id } });
    return { id };
  }
}
