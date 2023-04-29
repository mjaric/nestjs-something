export type FieldInfo<T> = { [P in keyof T]: FieldInfoBase<T, P> }[keyof T];

interface FieldInfoBase<T, P extends keyof T> {
  /**
   * Name of the field
   */
  name: P;
  /**
   * Type of the field
   */
  type: () => T[P];

  allowNull: boolean;
  default?: () => T[P];
  primary: boolean;
  unique: boolean;
}

export interface SchemaInfo<M> {
  /**
   * Fields of the schema
   */
  fields: FieldInfo<M>[];
}
