import { Field } from "../../src";

export class Address {
  @Field({ type: String, defaultValue: "" })
  addressLine = "";
  @Field()
  postalCode = "";
  @Field()
  city = "";
}
