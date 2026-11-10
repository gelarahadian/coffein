import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  CreateProductInputSchema,
  UpdateProductInputSchema,
} from "@coffein/shared";
import { ProductsService } from "./products.service";
import { CategoriesService } from "./categories.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  // ---------- Public ----------

  @Get("products")
  list() {
    return this.productsService.list();
  }

  @Get("products/:id")
  byId(@Param("id") id: string) {
    return this.productsService.byId(id);
  }

  @Get("categories")
  listCategories() {
    return this.categoriesService.list();
  }

  // ---------- Admin ----------

  @Post("admin/products")
  @UseGuards(JwtAuthGuard)
  create(
    @Body(new ZodValidationPipe(CreateProductInputSchema)) dto: { name: string; description: string; price: number; imageUrl: string | null; categoryId: string | null; isAvailable: boolean },
  ) {
    return this.productsService.create(dto);
  }

  @Patch("admin/products/:id")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateProductInputSchema)) dto: Partial<{ name: string; description: string; price: number; imageUrl: string | null; categoryId: string | null; isAvailable: boolean }>,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete("admin/products/:id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }

  @Post("admin/categories")
  @UseGuards(JwtAuthGuard)
  createCategory(@Body("name") name: string) {
    return this.categoriesService.create(name);
  }

  @Delete("admin/categories/:id")
  @UseGuards(JwtAuthGuard)
  removeCategory(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
