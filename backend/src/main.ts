import "dotenv/config";
import cookieParser from "cookie-parser";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { env } from "./env";
import { PrismaFilter, ZodFilter } from "./shared/filters";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new ZodFilter(), new PrismaFilter());
  await app.listen(env.PORT);
}

void bootstrap();
