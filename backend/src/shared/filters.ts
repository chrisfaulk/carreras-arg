import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { ZodError } from "zod";

interface HostPair {
  req: Request;
  res: Response;
}

function body(host: ArgumentsHost): HostPair {
  const ctx = host.switchToHttp();

  return { req: ctx.getRequest<Request>(), res: ctx.getResponse<Response>() };
}

@Catch(ZodError)
export class ZodFilter implements ExceptionFilter {
  catch(_error: ZodError, host: ArgumentsHost): void {
    const { res } = body(host);

    res.status(HttpStatus.BAD_REQUEST).json({ error: { code: "BAD_REQUEST", message: "Datos inválidos" } });
  }
}

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaFilter implements ExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const { res } = body(host);

    if (error.code === "P2025" || error.code === "P2003") {
      res.status(HttpStatus.NOT_FOUND).json({ error: { code: "NOT_FOUND", message: "No encontrado" } });

      return;
    }

    res.status(HttpStatus.CONFLICT).json({ error: { code: "CONFLICT", message: "Conflicto de datos" } });
  }
}
