import { AggregateRoot, EmbedsMany, EmbedsOne, Field } from "../../src";
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
}
