import {
  AggregateRoot,
  EmbedsMany,
  EmbedsOne,
  Field,
  SchemaInfo,
} from "../../src";
import { Address } from "./address.model";
import { Hobby } from "./hobby.model";
import { UserAddressChanged, UserCreated } from "./events";
import { Apply } from "../../src/schema";

export function defaultRole() {
  return "user";
}

export function defaultAcceptedTerms() {
  return false;
}

@AggregateRoot(2)
export class User {
  @Field({ primary: true })
  id!: string;
  @Field()
  firstName!: string;
  @Field()
  lastName!: string;
  @Field()
  age!: number;
  @Field({ default: defaultAcceptedTerms })
  acceptedTerms!: boolean;
  @Field({ default: defaultRole })
  role!: string;

  @EmbedsOne()
  address?: Address;
  @EmbedsMany()
  readonly hobbies: Hobby[] = [];

  // versioning
  version = 0;
  snapshotVsn = 0;

  @Apply(UserCreated)
  onUserCreated(event: UserCreated, _formHistory?: boolean) {
    this.id = event.id;
    this.firstName = event.firstName;
    this.lastName = event.lastName;
    this.age = event.age;
    this.acceptedTerms = event.acceptedTerms;
    this.role = event.role;
    this.address = new Address();
    this.address.addressLine = event.address.addressLine;
    this.address.postalCode = event.address.postalCode;
    this.address.city = event.address.city;
    this.version++;
  }

  @Apply(UserAddressChanged)
  onUserAddressChanged(event: UserAddressChanged, _formHistory?: boolean) {
    this.address = new Address();
    this.address.addressLine = event.addressLine;
    this.address.postalCode = event.postalCode;
    this.address.city = event.city;
    this.version++;
  }
}

export const userSchemaInfo: SchemaInfo<User> = {
  fields: [
    {
      name: "id",
      type: String,
      primary: true,
      unique: false,
      allowNull: false,
      default: undefined,
    },
    {
      name: "firstName",
      type: String,
      primary: false,
      unique: false,
      allowNull: false,
      default: undefined,
    },
    {
      name: "lastName",
      type: String,
      primary: false,
      unique: false,
      allowNull: false,
      default: undefined,
    },
    {
      name: "age",
      type: Number,
      primary: false,
      unique: false,
      allowNull: false,
      default: undefined,
    },
    {
      name: "acceptedTerms",
      type: Boolean,
      primary: false,
      unique: false,
      allowNull: false,
      default: defaultAcceptedTerms,
    },
    {
      name: "role",
      type: String,
      primary: false,
      unique: false,
      allowNull: false,
      default: defaultRole,
    },
  ],
};
