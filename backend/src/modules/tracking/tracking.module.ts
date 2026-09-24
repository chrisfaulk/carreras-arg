import { Module } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { TrackingController } from "./tracking.controller";
import { TrackingService } from "./tracking.service";

@Module({ controllers: [TrackingController], providers: [TrackingService, PrismaService], exports: [TrackingService] })
export class TrackingModule {}
