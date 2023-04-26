import { isObject } from "@nestjs/common/utils/shared.utils";

export abstract class Change {
  protected constructor(
    public readonly type: "field" | "embedOne" | "embedMany",
    public readonly fieldName: string,
  ) {
  }
}

export class FieldChange extends Change {
  constructor(fieldName: string, public readonly value: any, public readonly oldValue: any) {
    super("field", fieldName);
  }
}

export class EmbedOneChange extends Change {
  constructor(
    fieldName: string,
    public readonly value: Map<string, Change>,
    public readonly action: "create" | "update" | "delete",
  ) {
    super("embedOne", fieldName);
  }
}

export class EmbedManyChange extends Change {
  constructor(
    fieldName: string,
    public readonly value: Map<string, Change>,
    public readonly index: number,
    public readonly action: "create" | "update" | "delete",
  ) {
    super("embedMany", fieldName);
  }

}

export type Error =
  { validator: "required", message: string }
  | { validator: "number", message: string, eq?: number, gt?: number, gte?: number, lt?: number, lte?: number }
  | { validator: "length", message: string, min?: number, max?: number }
  | { validator: "format", message: string }
  | { validator: "confirm", message: string, otherField: string }
  | { validator: "inclusion", message: string, enum: Array<string | number> }
  | { validator: "exclusion", message: string, enum: Array<string | number> }
  | { validator: "unique", message: string, }
  | { validator: "subset", message: string, }
  | { validator: "acceptance", message: string, }
  | { validator: "embed", message: string, errors: Errors }
  | { validator: "embedMany", message: string, index: number, errors: Errors }


export type Errors = {
  [key: string]: Array<Error>
};


export class Embed<E> {
  data: E;

  constructor(data: E) {
    this.data = data;
  }
}

export type CastOptions = {
  force?: boolean,
  empty?: Array<undefined | number | string | null>,
  message?: string,
}

export type Model<T> = { [key in keyof T]: T[keyof T] };
export type Params<P> = { [key in keyof P]: P[keyof P] };
export type FieldName<T, P> = keyof T | keyof P;

export class Changeset<T extends Model<T>, P extends Params<P> = unknown> {
  protected _data: T;
  protected _changes: Map<FieldName<T, P>, Change>;
  protected _errors: Errors = {};
  protected _params: P = {} as P;

  get data() {
    return this._data;
  }

  get errors() {
    return this._errors;
  }

  getChange(field: keyof P | keyof T): Change | undefined {
    return this._changes.get(field);
  }

  get changes() {
    return this._changes;
  }

  constructor(data: T, changes?: Map<FieldName<T, P>, Change>, errors?: Errors, params?: P) {
    this._data = data;
    this._changes = new Map();
    this._errors = {};
    this._params = params ?? {} as P;
  }

  static change<T extends Model<T>>(model: T): Changeset<T> {
    return new Changeset(model);
  }

  cast<P extends Params<P>>(params: P, permitted: (keyof P)[], opts?: CastOptions): Changeset<T, P> {
    const changeset = new Changeset(this._data, this._changes, this._errors, params);
    const castOpts: CastOptions = { force: false, empty: [undefined], ...opts ?? {} };
    Object.entries(params).forEach(([key, value]) => {
      if(!permitted.includes(key as keyof P)) {
        return;
      }
      if (castOpts.empty?.includes(value as any)) {
        return;
      }

      if(key in this._data) {
        if (castOpts.force) {
          changeset._changes.set(key, new FieldChange(key, params[key], this._data[key]));
          return;
        }
        if (this._data[key] !== params[key]) {
          changeset._changes.set(key, new FieldChange(key, params[key], this._data[key]));
        }
        return;
      }

      // this is last and should be considered as field
      changeset._changes.set(key, new FieldChange(key, params[key], undefined));

    });

    return changeset;
  }

  /*castEmbed<K extends keyof T>(field: K, embed: Embed<T[K]>, allowedFields: (keyof T[K])[]): Changeset<T> {
    const data = this.changes.get(field as string) || this.data[field];
    const embedChangeset = new Changeset<T[K]>(data as T[K]);
    embedChangeset.changes = new Map(Object.entries(data as Partial<T[K]>));

    const castedEmbedChangeset = embedChangeset.cast(allowedFields);
    this.changes.set(field as string, castedEmbedChangeset.changes as EmbedOneChange<Partial<T[K]>>);
    this.errors[field] = castedEmbedChangeset.errors;

    return this;
  }


  castEmbedMany<K extends keyof T>(field: K, embeds: Embed<T[K][number]>[], allowedFields: (keyof T[K][number])[]): Changeset<T> {
    const data = this.changes.get(field as string) || this.data[field];

    if (!Array.isArray(data)) {
      throw new Error(`The field '${field}' should be an array.`);
    }

    const castedEmbeds: EmbedOneChange<T[K][number]>[] = [];

    for (let i = 0; i < data.length; i++) {
      const embedChangeset = new Changeset<T[K][number]>(data[i] as T[K][number]);
      embedChangeset.changes = new Map(Object.entries(data[i] as Partial<T[K][number]>));

      const castedEmbedChangeset = embedChangeset.cast(allowedFields);
      castedEmbeds.push(castedEmbedChangeset.changes as EmbedOneChange<T[K][number]>);
      this.errors[field] = castedEmbedChangeset.errors;
    }

    this.changes.set(field as string, castedEmbeds as EmbedManyChanges<T[K]>);
    return this;
  }*/

  validateChange(field: keyof P, validator: (value: P[keyof P], changeset: Changeset<T>) => boolean | Promise<boolean>, message: string) {
    const value = this._changes.get(field as string)?.value;
    if (value) {
      return validator(value, this);
    }
    return true;
  }
}