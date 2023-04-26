import { Type } from "@nestjs/common";
import { FieldMetadata } from "./decorators";

export class Schema<A> {
  fields: FieldMetadata<A>;
  constructor(private readonly aggregateType: Type<A>) {}
}
