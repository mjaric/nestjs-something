import { Field } from "../../src";
import { v4 } from "uuid";

export class Address {
  @Field({ type: String, primary: true, default: () => v4() })
  id!: string;
  addressLine = "";
  @Field()
  postalCode = "";
  @Field()
  city = "";
}
