import { describe } from "node:test";
import { AggregateRoot, getSchemaInfo } from "../src";
import { Hobby } from "./domain/hobby.model";
import { Address } from "./domain/address.model";
import { User, userSchemaInfo } from "./domain/user.model";
import { getFieldInfo } from "../src/schema";

describe("Decorators", () => {
  it("should register aggregate roots", () => {
    expect(true).toBe(true);
  });
  describe("AggregateRoot", () => {
    it("should register aggregate roots", () => {
      expect(Reflect.getMetadata(AggregateRoot.META_KEY, User)).toStrictEqual({
        vsn: 2,
      });
      expect(
        Reflect.getMetadata(AggregateRoot.META_KEY, Address),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata(AggregateRoot.META_KEY, Hobby),
      ).toBeUndefined();
    });
  });

  describe("Field", () => {
    it("should register fields", () => {
      const fields: Array<keyof User> = [
        "id",
        "firstName",
        "lastName",
        "age",
        "acceptedTerms",
        "role",
      ];
      fields.forEach((field, index) => {
        expect(getFieldInfo(User, field)).toStrictEqual(
          userSchemaInfo.fields[index],
        );
      });
      expect(getFieldInfo(User, "address")).toBeUndefined();
      expect(getFieldInfo(User, "hobbies")).toBeUndefined();
    });

    it("should register fields in schema", () => {
      const schema = getSchemaInfo(User);
      expect(schema).toBeDefined();
      expect(schema.fields).toStrictEqual(userSchemaInfo.fields);
    });
  });
});
