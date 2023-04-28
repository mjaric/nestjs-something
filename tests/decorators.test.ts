import { describe } from "node:test";
import { AggregateRoot, EmbedsMany, EmbedsOne, Field } from "../src";
import { Hobby } from "./domain/hobby.model";
import { Address } from "./domain/address.model";
import { User } from "./domain/user.model";

describe("Decorators", () => {
  it("should register aggregate roots", () => {
    expect(true).toBe(true);
  });
  describe("AggregateRoot", () => {
    it("should register aggregate roots", () => {
      expect(Reflect.getMetadata(AggregateRoot.META_KEY, User)).toStrictEqual({
        vsn: 1,
      });

      expect(Reflect.getMetadata(AggregateRoot.META_KEY, Address)).toBe(
        undefined,
      );

      expect(Reflect.getMetadata(AggregateRoot.META_KEY, Hobby)).toBe(
        undefined,
      );
    });

    it("should register fields", () => {
      expect(Reflect.getMetadata(Field.META_KEY, User, "id")).toBeDefined();

      expect(
        Reflect.getMetadata(Field.META_KEY, User, "firstName"),
      ).toBeDefined();
      expect(
        Reflect.getMetadata(Field.META_KEY, User, "lastName"),
      ).toBeDefined();
      expect(Reflect.getMetadata(Field.META_KEY, User, "age")).toBeDefined();
      expect(
        Reflect.getMetadata(Field.META_KEY, User, "acceptedTerms"),
      ).toBeDefined();
      expect(Reflect.getMetadata(Field.META_KEY, User, "role")).toBeDefined();
      expect(
        Reflect.getMetadata(EmbedsOne.META_KEY, User, "address"),
      ).toBeDefined();
      expect(
        Reflect.getMetadata(EmbedsMany.META_KEY, User, "hobbies"),
      ).toBeDefined();

      expect(
        Reflect.getMetadata(Field.META_KEY, Address, "addressLine"),
      ).toBeDefined();
      expect(
        Reflect.getMetadata(Field.META_KEY, Address, "postalCode"),
      ).toBeDefined();
      expect(
        Reflect.getMetadata(Field.META_KEY, Address, "city"),
      ).toBeDefined();

      expect(Reflect.getMetadata(Field.META_KEY, Hobby, "id")).toBeDefined();
      expect(Reflect.getMetadata(Field.META_KEY, Hobby, "name")).toBeDefined();
      expect(Reflect.getMetadata(Field.META_KEY, Hobby, "since")).toBeDefined();
    });
  });
});
