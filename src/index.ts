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
export { change } from "./changeset";
export { cast } from "./changeset/changeset";
export { Changeset } from "./changeset/changeset";
