import { Errors } from "./validators";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export type Model<M> = { [key in keyof M]: M[key] };
export type Params<P> = Partial<{ [key in keyof P]: P[key] }>;

export interface Changeset<M extends Model<M>, P extends Params<P> = unknown> {
  data: M;
  changes: Partial<M>;
  errors: Errors<P>;
  params: Params<P>;
}

export type CastOptions = {
  force?: boolean;
  empty?: Array<unknown>;
  message?: string;
};

export function cast<M extends Model<M>, P extends Params<P>>(
  params: P,
  permitted: (keyof P)[],
  opts?: CastOptions,
) {
  return (source: Observable<Changeset<M>>): Observable<Changeset<M, P>> => {
    return source.pipe(
      map(({ data, errors, changes }) => {
        const castOpts: CastOptions = {
          force: opts?.force ?? false,
          empty: [...(opts?.empty ?? [undefined])],
          message: opts?.message ?? "is invalid",
        };
        const newChangeset: Changeset<M, P> = {
          data,
          changes,
          errors: { ...errors },
          params,
        };
        Object.keys(params).forEach((k) => {
          const key = k as keyof P;
          const value = params[key as string];
          if (!permitted.includes(key)) {
            return;
          }
          // empty check
          if (isEmpty(castOpts.empty, value)) {
            // if it is empty, then we should not assign it to changes
            return;
          }

          // todo check schema, if it is embed or embedMany
          // if schema is not found, then it should be considered as field
          // so this is last resort and we will make asign it to changes
          // fields (without schema check)
          if (key in data) {
            if (castOpts.force) {
              newChangeset.changes[key] = value;
              return;
            }
            if (data[key as string] === value) {
              return;
            } else {
              newChangeset.changes[key] = value;
            }
          }
          // non data fields are always assigned to changes if it is not empty
          // they are considered as virtual fields
          // we need this for validations such as confirm and acceptance
          // note that this should only cast if the param field is in permitted list
          newChangeset.changes[key] = value;
        });

        return newChangeset;
      }),
    );
  };
}

export function isEmpty(empties: Array<unknown>, value: unknown): boolean {
  return empties.some((v: unknown) => {
    if (!Number.isNaN(Number(v)) && !Number.isNaN(Number(value))) {
      return v === value;
    }
    if (typeof v === "string" && typeof value === "string") {
      return v === value;
    }
    if (v === null && value === null) {
      return true;
    }
    if (v === undefined && value === undefined) {
      return true;
    }
    // if array, then check length and content
    if (Array.isArray(v) && Array.isArray(value)) {
      if (v.length !== value.length) {
        return false;
      }
      return v.every((v, i) => v === value[i]);
    }
    return v === value;
  });
}
