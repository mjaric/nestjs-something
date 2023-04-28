import { Observable, of } from "rxjs";
import { Changeset } from "./changeset";

// re-export
export { Changeset, Model, cast, CastOptions, Params } from "./changeset";
export { Error, Errors }  from "./validators";

export function change<T, P = unknown>(model: T): Observable<Changeset<T, P>> {
  return of({
    data: model,
    changes: {},
    errors: {},
    params: {},
  });
}



