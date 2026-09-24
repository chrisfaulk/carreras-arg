import { HttpException, HttpStatus } from "@nestjs/common";

export function fail(status: HttpStatus, code: string, message: string): never {
  throw new HttpException({ error: { code, message } }, status);
}

export interface OkResult {
  ok: true;
}

export interface IdResult {
  id: string;
}

export const ERR = {
  unauth: (): never => fail(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "No autenticado"),
  forbidden: (): never => fail(HttpStatus.FORBIDDEN, "FORBIDDEN", "Sin permiso"),
  notFound: (): never => fail(HttpStatus.NOT_FOUND, "NOT_FOUND", "No encontrado"),
  conflict: (code: string, message: string): never => fail(HttpStatus.CONFLICT, code, message),
  unprocessable: (code: string, message: string): never => fail(HttpStatus.UNPROCESSABLE_ENTITY, code, message),
  bad: (message: string): never => fail(HttpStatus.BAD_REQUEST, "BAD_REQUEST", message),
};
