// Reglas propias del repo (solo reglas core de ESLint, sin plugins).
// Oxlint (ver oxlint.config.ts) cubre evidencia de tipos y colecciones;
// aqui solo lo que Oxlint no expresa: veto de PATCH y de useEffect.

const noPatch = {
  files: ["backend/**/*.ts", "frontend/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "Decorator[expression.callee.name='Patch']",
        message: "Prohibido PATCH: POST solo crea, PUT muta o transiciona, DELETE borra.",
      },
      {
        selector: "Property[value.value='PATCH']",
        message: "Prohibido method 'PATCH': usar PUT para mutar.",
      },
    ],
  },
};

const noUseEffect = {
  files: ["frontend/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "ImportSpecifier[imported.name='useEffect']",
        message: "Prohibido useEffect: usar RSC y Server Actions; islands client con TanStack Query.",
      },
      {
        selector: "ImportSpecifier[imported.name='useLayoutEffect']",
        message: "Prohibido useLayoutEffect: usar RSC y Server Actions; islands client con TanStack Query.",
      },
      {
        selector: "CallExpression[callee.name='useEffect']",
        message: "Prohibido useEffect: usar RSC y Server Actions; islands client con TanStack Query.",
      },
      {
        selector: "CallExpression[callee.name='useLayoutEffect']",
        message: "Prohibido useLayoutEffect: usar RSC y Server Actions; islands client con TanStack Query.",
      },
    ],
  },
};

export default [noPatch, noUseEffect];
