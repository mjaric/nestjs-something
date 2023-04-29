import { Changeset, Model } from "./changeset";

export type EmbedChangeAction = "create" | "update" | "delete";
type CastEmbedNested<M, PI, PR> = (
  changeset: Changeset<M>,
  parmas: PI,
) => Changeset<M>;

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

/*
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
*/
