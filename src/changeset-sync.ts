/*
export abstract class Change<K> {
  protected constructor(public readonly fieldName: K) {}
}

export type EmbedChangeAction = "create" | "update" | "delete";

export class FieldChange<P, K extends keyof P> extends Change<K> {
  constructor(
    fieldName: K,
    public readonly value: P[K] | null,
    public readonly oldValue: P[K] | null,
  ) {
    super(fieldName);
  }
}

export class EmbedOneChange<P, K extends keyof P> extends Change<K> {
  constructor(
    fieldName: K,
    public readonly value: Map<K, Change<P>>,
    public readonly action: EmbedChangeAction,
  ) {
    super(fieldName);
  }
}

export class EmbedManyChange<P, K extends keyof P> extends Change<K> {
  constructor(
    fieldName: K,
    public readonly value: Map<K, Change<P>>,
    public readonly index: number,
    public readonly action: EmbedChangeAction,
  ) {
    super(fieldName);
  }
}

export type MsgFormatter<P extends Params<P>, K extends keyof P> = (
  fieldName: K,
  value: P[K],
  oldValue: P[K] | undefined,
) => string;

export type Error =
  | { validator: "required"; message: string }
  | {
      validator: "number";
      message: string;
      eq?: number;
      gt?: number;
      gte?: number;
      lt?: number;
      lte?: number;
    }
  | { validator: "length"; message: string; min?: number; max?: number }
  | { validator: "format"; message: string }
  | { validator: "confirm"; message: string; otherField: string }
  | { validator: "inclusion"; message: string; enum: Array<string | number> }
  | { validator: "exclusion"; message: string; enum: Array<string | number> }
  | { validator: "unique"; message: string }
  | { validator: "subset"; message: string }
  | { validator: "acceptance"; message: string }
  | { validator: "embed"; message: string; errors: Errors }
  | { validator: "embedMany"; message: string; index: number; errors: Errors };

export type Errors = {
  [key: string]: Array<Error>;
};

export class Embed<E> {
  data: E;

  constructor(data: E) {
    this.data = data;
  }
}

type CastEmbedNested<M, PI, PR> = (
  changeset: ChangesetSync<M>,
  parmas: PI,
) => ChangesetSync<M, PR>;

export type CastEmbedFn<M extends Model<M>, P, PKey> = PKey extends "."
  ? CastEmbedNested<M, P, P>
  : PKey extends keyof P
  ? CastEmbedNested<M, P[PKey], P[PKey]>
  : never;

export type CastOptions = {
  force?: boolean;
  empty?: Array<undefined | number | string | null>;
  message?: string;
};

export type ChangeMap<P extends Params<P>> = Partial<{
  [key in keyof P]: Change<key>;
}>;

export type Model<M> = { [key in keyof M]: M[key] };
export type Params<P> = { [key in keyof P]: P[key] };
export type FieldName<P> = keyof P;

export class ChangesetSync<M extends Model<M>, P extends Params<P> = unknown> {
  protected _data: M;
  protected _changes: ChangeMap<P>;
  protected _errors: Errors = {};
  protected _params: P = {} as P;

  get data() {
    return this._data;
  }

  get errors() {
    return this._errors;
  }

  getChange<PKey extends keyof P>(field: PKey): Change<PKey> | undefined {
    return this._changes[field];
  }

  get changes() {
    return this._changes;
  }

  get changesCount(): number {
    return Object.keys(this._changes).length;
  }

  constructor(data: M, changes?: ChangeMap<P>, errors?: Errors, params?: P) {
    this._data = data;
    this._changes = {};
    this._errors = {};
    this._params = params ?? ({} as P);
  }

  static change<T extends Model<T>>(model: T): ChangesetSync<T> {
    return new ChangesetSync(model, undefined);
  }

  cast<P extends Params<P>>(
    params: P,
    permitted: (keyof P)[],
    opts?: CastOptions,
  ): ChangesetSync<M, P> {
    const changeset = new ChangesetSync<M, P>(
      this._data,
      {},
      this._errors,
      params,
    );
    const castOpts: CastOptions = {
      force: false,
      empty: [undefined],
      ...(opts ?? {}),
    };
    Object.keys(params).forEach((k) => {
      const key = k as keyof P;
      const value = params[key];
      if (!permitted.includes(key as keyof P)) {
        return;
      }
      if (castOpts.empty?.includes(value)) {
        return;
      }

      if (key in this._data) {
        if (castOpts.force) {
          changeset._changes[key] = new FieldChange(
            key,
            params[key],
            this._data[key],
          );
          return;
        }
        if (this._data[key as string] !== params[key]) {
          changeset._changes[key] = new FieldChange(
            key,
            params[key],
            this._data[key],
          );
        }
        return;
      }

      // this is last and should be considered as field
      changeset._changes[key] = new FieldChange(key, params[key], undefined);
    });

    return changeset;
  }

  castEmbedOne<MKey extends keyof M, PKey extends keyof P | ".", Args>(
    fieldName: MKey,
    paramName: PKey,
    castFn: (instance: M[MKey]) => CastEmbedFn<M[MKey], P, PKey>,
    args: Args[],
  ): ChangesetSync<M, P> {
    let action: EmbedChangeAction = "update";
    let instance = this._data[fieldName];
    if (this._data[fieldName] === undefined) {
      action = "create";
      instance = this._data.constructor.prototype[fieldName].constructor();
    }
    const castParams =
      paramName !== "." ? this._params[paramName as keyof P] : this._params;
    const changeset = ChangesetSync.change(instance);
    const changesetFn = castFn(instance);
    const result = changesetFn.call(instance, [changeset, castParams]);

    if (paramName === ".") {
      this._changes = { ...this._changes, ...result._changes };
      this._errors = { ...this._errors, ...result._errors };
    } else {
      this._changes[paramName as string] = { ...result._changes };
      this._errors[paramName as string] = { ...result._errors };
    }

    return this;
  }

  validateChange(
    field: keyof P,
    validator: (
      value: P[keyof P],
      changeset: ChangesetSync<M, P>,
    ) => undefined | string | Promise<string | undefined>,
  ): undefined | string | Promise<string | undefined> {
    const change = this._changes[field];
    if (change instanceof FieldChange) {
      const value = change.value;
      if (value) {
        return validator(value, this);
      }
    }
    return;
  }

  validateRequired(fieldName: string | string[], param2: { message: string }) {
    return undefined;
  }
}
*/
