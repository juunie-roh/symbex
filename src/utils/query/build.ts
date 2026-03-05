import { normalize } from "./normalize";

function build(...queries: string[]): string {
  return queries.map((query) => normalize(query)).join(" ");
}

export { build };
