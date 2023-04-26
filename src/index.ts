import "reflect-metadata";

export {
  AggregateRoot,
  EmbedsMany,
  EmbedsOne,
  Field,
  EmbedsManyOpts,
  EmbedsOneOpts,
  FieldMetadata,
  getAggregateSchema,
  toCamelcase,
  getReferenceKey,
} from "./decorators";
export { AggregatesModule } from "./aggregates.module";
export { Schema } from "./schema";
export { Change, Changes, CastOpts, Changeset } from "./changeset";
