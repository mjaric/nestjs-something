import { Changeset, Model } from "./changeset";

export type EmbedChangeAction = "create" | "update" | "delete";

export type CastEmbedFn<M extends Model<M>, P> = {
  /**
   * Signature of function that should handle the cast to embedded model/aggregate.
   * @param c Changeset instance
   * @param p Parameter from field with the given name on parent changeset parmas.
   */
  [key in keyof P]: (c: Changeset<M>, p: P[key]) => Changeset<M, P[key]>;
} & {
  /**
   * Signature of function that should handle the cast to embedded model/aggregate.
   * @param c Changeset instance
   * @param p Parameter of the parent changeset
   */
  ["."]: (c: Changeset<M>, p: P) => Changeset<M, P>;
};

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
