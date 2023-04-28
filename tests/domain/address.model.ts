import { Field } from "../../src";
import { Params } from "../../src/changeset-sync";

export class Address {
  @Field({ type: String, defaultValue: "" })
  addressLine = "";
  @Field()
  postalCode = "";
  @Field()
  city = "";
}