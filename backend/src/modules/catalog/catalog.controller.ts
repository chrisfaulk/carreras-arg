import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { RawListQuery, listQuerySchema } from "../../shared/pagination";
import { AdminGuard, Public } from "../identity/guards";
import { CatalogService, UniversityInput, universitySchema } from "./catalog.service";

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get("universities")
  universities(@Query() query: RawListQuery) {
    return this.catalog.listUniversities(listQuerySchema.parse(query));
  }

  @UseGuards(AdminGuard)
  @Post("universities")
  createUniversity(@Req() req: Request, @Body() body: UniversityInput) {
    return this.catalog.createUniversity(req.user.id, universitySchema.parse(body));
  }

  @UseGuards(AdminGuard)
  @Put("universities/:id")
  updateUniversity(@Req() req: Request, @Param("id") id: string, @Body() body: UniversityInput) {
    return this.catalog.updateUniversity(req.user.id, id, universitySchema.parse(body));
  }

  @UseGuards(AdminGuard)
  @Delete("universities/:id")
  deleteUniversity(@Req() req: Request, @Param("id") id: string) {
    return this.catalog.deleteUniversity(req.user.id, id);
  }
}
