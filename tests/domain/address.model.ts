import { Changeset, Field } from "../../src";
import { Params } from "../../src/changeset";

export class Address {
  @Field({ type: String, defaultValue: "" })
  addressLine = "";
  @Field()
  postalCode = "";
  @Field()
  city = "";

  changeset(changeset: Changeset<Address>, params: Params<Address>): Changeset<Address> {
    return changeset.cast({...params}, ["addressLine", "postalCode", "city"])
      .validateRequired(["addressLine", "postalCode", "city"]);
  }

}
