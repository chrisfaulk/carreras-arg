import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { RawListQuery, listQuerySchema } from "../../shared/pagination";
import { AdminGuard, Public } from "../identity/guards";
import {
  CatalogService,
  CareerInput,
  careerSchema,
  PlanInput,
  planSchema,
  PlanUpdateInput,
  planUpdateSchema,
  UniversityInput,
  universitySchema,
} from "./catalog.service";

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

  @Public()
  @Get("careers")
  careers(@Query() query: RawListQuery) {
    return this.catalog.listCareers(listQuerySchema.parse(query));
  }

  @UseGuards(AdminGuard)
  @Post("careers")
  createCareer(@Req() req: Request, @Body() body: CareerInput) {
    return this.catalog.createCareer(req.user.id, careerSchema.parse(body));
  }

  @UseGuards(AdminGuard)
  @Put("careers/:id")
  updateCareer(@Req() req: Request, @Param("id") id: string, @Body() body: UniversityInput) {
    return this.catalog.updateCareer(req.user.id, id, universitySchema.parse(body));
  }

  @UseGuards(AdminGuard)
  @Delete("careers/:id")
  deleteCareer(@Req() req: Request, @Param("id") id: string) {
    return this.catalog.deleteCareer(req.user.id, id);
  }

  @Public()
  @Get("study-plans")
  plans(@Query() query: RawListQuery) {
    return this.catalog.listPlans(listQuerySchema.parse(query));
  }

  @UseGuards(AdminGuard)
  @Post("study-plans")
  createPlan(@Req() req: Request, @Body() body: PlanInput) {
    return this.catalog.createPlan(req.user.id, planSchema.parse(body));
  }

  @UseGuards(AdminGuard)
  @Put("study-plans/:id")
  updatePlan(@Req() req: Request, @Param("id") id: string, @Body() body: PlanUpdateInput) {
    return this.catalog.updatePlan(req.user.id, id, planUpdateSchema.parse(body));
  }

  @UseGuards(AdminGuard)
  @Delete("study-plans/:id")
  deletePlan(@Req() req: Request, @Param("id") id: string) {
    return this.catalog.deletePlan(req.user.id, id);
  }
}
