import { Errors } from "./validators";
import { Observable, OperatorFunction } from "rxjs";
import { map } from "rxjs/operators";
import { CastEmbedFn } from "./embeds";
import { getSchemaInfo } from "../schema";
import { Type } from "@nestjs/common";

export type Model<M> = { [key in keyof M]: M[key] };
/**
 * Params passed to the changeset.
 */
export type Params<P> = Partial<{ [key in keyof P]: P[key] }>;
export type Empty = undefined | null | "" | 0 | false | [];
export interface Changeset<M extends Model<M>, P extends Params<P> = object> {
  data: M;
  changes: Partial<M>;
  errors: Errors<P>;
  params: Params<P>;
}

export type CastOptions = {
  force?: boolean;
  empty?: Array<Empty>;
  message?: string;
};

export function cast<M extends Model<M>, P extends Params<P>>(
  params: P,
  permitted: (keyof M)[],
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
        permitted.forEach((key) => {
          const value = params[key as unknown as keyof P] as object;
          if (isEmpty(castOpts.empty ?? [undefined, [], ""], value)) {
            return;
          }
          if (key in data) {
            if (castOpts.force) {
              changes[key] = value as unknown as M[keyof M];
              return;
            }
            const dataValue = data[key] as object;
            if (key in data && dataValue === value) {
              return;
            } else {
              changes[key] = value as M[keyof M];
            }
          }
          changes[key] = value as M[keyof M];
        });

        return newChangeset;
      }),
    );
  };
}

/**
 * Casts params to {@link schema.EmbedsOne} or {@link schema.EmbedsMany}.
 *
 * @typeParam M - type of model whose association is being casted to changeset
 * @typeParam P - type of params passed to changeset
 * @typeParam CP - type of params passed to child changeset
 * @typeParam Args - type of additional arguments that should be passed to resolved function from `embedCastFn`
 *
 * @param assoc - association name on model, required to determine if there is a change
 * @param pickParam - picks param attribute from current changeset.params as new params for child changeset.
 * @param embedCastFn - function from assoc model to cast observable child changeset and picked params.
 * @param embedCastFnParams - additional arguments that should be passed to resolved function from `embedCastFn`
 * @returns observable changeset of model M with child changes and validation errors if any for M[assoc] casted params to embeded model.
 *
 * @remarks
 * It creates a new instance of changeset under the hood, checks if there is association
 * on data model, then it will cast picked params to changeset. If data model is undefined or null,
 * then it will create new instance of it and assign it to the new child changeset.
 *
 * @example
 * ```ts
 * import { change, cast, castEmbed, Changeset } from "nestjs-aggregate";
 *
 * class User {
 *    id: number;
 *    name: string;
 *    email: string;
 *    @EmbedsOne(() => Address)
 *    address: Address;
 *    @EmbedsMany(() => Address)
 *    addresses: Address[];
 *    constructor(id: number, name: string, email: string, address: Address, addresses: Address[]) {
 *      this.id = id;
 *      this.name = name;
 *      this.email = email;
 *      this.address = address;
 *      this.addresses = addresses;
 *    }
 *  }
 *
 *  class Address {
 *    street: string;
 *    city: string;
 *    constructor(street: string, city: string) {
 *      this.street = street;
 *      this.city = city;
 *    }
 *
 *    updateAddress(changeset: Observable<Changeset<Address>,{ street: "Other Street" }>, params: { street: "Other Street" }, userId: number) {
 *      return changeset.pipe(
 *        cast(params, ["street"]),
 *        validateRequired(["street"]),
 *      );
 *    }
 *  }
 *
 *  const user: User = {
 *    id: 1,
 *    name: "John Doe",
 *    email: "some@example.com",
 *    address: {
 *      street: "Some Street",
 *      city: "Some City",
 *    },
 *    addresses: [
 *      { street: "Some Street", city: "Some City" },
 *      { street: "Another Street", city: "Another City" },
 *    ],
 *  };
 *
 *  const changeset = change(user)
 *    .pipe(
 *      cast({ email: "other@example.com", address: { street: "Other Street" } }, ["email"]),
 *      validateRequired(["email"]),
 *      validateEmail(["email"]),
 *      castEmbed("address", "newAddress", (instance) => instance.updateAddress, [user.id], {action: "update"}),
 *    );
 *  });
 *```
 */
export function castEmbed<
  M extends Model<M>,
  P extends Params<M>,
  CP extends "." | keyof M,
  Args,
>(
  assoc: keyof M,
  pickParam: CP,
  embedCastFn: CastEmbedFn<M, P>[CP],
  embedCastFnParams: Args[],
): OperatorFunction<Changeset<M, P>, Changeset<M, P>> {
  return (changeset$) => {
    return changeset$.pipe(
      map((changeset) => {
        const { data, params, changes, errors } = changeset;
        const schemaInfo = getSchemaInfo(data.constructor as Type<M>);
        return { data, params, changes, errors };
      }),
    );
  };
}

export function isEmpty(empties: Array<Empty>, value: unknown): boolean {
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
