import { AggregateRoot, Changeset, EmbedsMany, EmbedsOne, Field } from "../../src";
import { Address } from "./address.model";
import { Hobby } from "./hobby.model";
import { UserCreated } from "./events";

@AggregateRoot()
export class User {
  @Field()
  id: string;
  @Field()
  firstName: string;
  @Field()
  lastName: string;
  @Field()
  age: number;
  @Field()
  acceptedTerms = false;
  @Field()
  role = "user";

  @EmbedsOne()
  address?: Address;

  @EmbedsMany()
  readonly hobbies: Hobby[] = [];

  createUser(/* ctx: Context<User>, */ params: Partial<User>): Changeset<User> {
    const user_id = "user-1";

    // this will create new changes in changes, including association changes
    // for associations, validation is done inside e.g.
    // { with: (hobby) => hobby.changeset } or { with: (address) => address.changeset }
    const changeset = Changeset.change(this)
      .cast(params, ["firstName", "lastName", "age", "acceptedTerms", "role"])
      .castChange("id", user_id)
      // below will add hobies to the existing ones if new are found in params.hobbies
      // castAssoc will automaticaly add change user_id to all hobbies in params.hobbies
      // castAssoc will automaticaly add change user_id to address in params.address
      .castEmbedOne(
        "address",
        (instance) => instance.changeset(changeset, params.address, user_id)
      )

    // this will do validation for user aggregate, here we can also do validation for associations
    // if needed all changes are still in graph of Changeset.changes private property
    changeset
      .validateRequired(["firstName", "lastName", "age", "acceptedTerms", "role"])
      .validateLength("firstName", { min: 3, max: 255, message: "First name must be between 3 and 255 characters" })
      .validateLength("lastName", { min: 3, max: 255, message: "Last name must be between 3 and 255 characters" })
      .validateInclusion("role", { in: ["user", "admin"], message: "Role must be either user or admin" })
      .validateExclusion("role", { in: ["superadmin"], message: "Role cannot be superadmin" })
      .validateAcceptance("acceptedTerms", { message: "You must accept the terms" })
      .validateChange("age", (age: number, _old: number) => age >= 18, {}, {
        message: "You must be 18 years or older",
        validator: "age",
      })

    // below will attempt to map changeset changes to given event, if validation fails, it will be skipped and events will be empty
    // it can be called multiple times, but it will only map changeset changes if changeset is valid
    changeset
      .mapTo(UserCreated, (changeset) => {
        const address = changeset.getAssoc("address");
        return new UserCreated(
          user_id,
          changeset.getChange("firstName").value,
          changeset.getChange("lastName").value,
          changeset.getChange("age").value,
          changeset.getChange("acceptedTerms").value,
          changeset.getChange("role").value,
          {
            addressLine: address.getChange("addressLine").value,
            postalCode: address.getChange("postalCode").value,
            city: address.getChange("city").value,
          }
        );
      })



    return changeset
  }
}
