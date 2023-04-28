import { AggregateRoot, EmbedsMany, EmbedsOne, Field } from "../../src";
import { Address } from "./address.model";
import { Hobby } from "./hobby.model";
import { UserAddressChanged, UserCreated } from "./events";
import { Apply } from "../../src/decorators";

@AggregateRoot(1)
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

  // versioning
  vsn = 0;
  snapshotVsn = 0;

  @Apply(UserCreated)
  onUserCreated(event: UserCreated, _formHistory?: boolean) {
    this.id = event.id;
    this.firstName = event.firstName;
    this.lastName = event.lastName;
    this.age = event.age;
    this.acceptedTerms = event.acceptedTerms;
    this.role = event.role;
    this.address = event.address;
    this.vsn++;
  }

  @Apply(UserAddressChanged)
  onUserAddressChanged(event: UserAddressChanged, _formHistory?: boolean) {
    this.address = new Address();
    this.address.addressLine = event.addressLine;
    this.address.postalCode = event.postalCode;
    this.address.city = event.city;
    this.vsn++;
  }
}
