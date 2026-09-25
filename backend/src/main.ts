import "dotenv/config";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { env } from "./env";
import { PrismaFilter, ZodFilter } from "./shared/filters";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );
  app.enableCors({ origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()), credentials: true });
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new ZodFilter(), new PrismaFilter());
  await app.listen(env.PORT);
}

void bootstrap();
