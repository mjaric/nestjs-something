import { Observable, of } from "rxjs";
import { Changeset } from "./changeset";

// re-export
export * from "./changeset";
export * from "./validators";

export function change<T, P = unknown>(model: T): Observable<Changeset<T, P>> {
  return of({
    data: model,
    changes: {},
    errors: {},
    params: {},
  });
}
