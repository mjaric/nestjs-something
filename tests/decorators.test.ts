import { describe } from "node:test";
import { getAggregateRootInfo, getSchemaInfo } from "../src/schema";
import { Hobby } from "./domain";
import { Address } from "./domain";
import { User, userSchemaInfo } from "./domain/user.model";
import { getFieldInfo } from "../src/schema";

describe("Decorators", () => {
  it("should register aggregate roots", () => {
    expect(true).toBe(true);
  });
  describe("AggregateRoot", () => {
    it("should register aggregate roots", () => {
      expect(getAggregateRootInfo(User)).toStrictEqual({
        vsn: 2,
        ...userSchemaInfo,
      });
      expect(getAggregateRootInfo(Address)).toBeUndefined();
      expect(getAggregateRootInfo(Hobby)).toBeUndefined();
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
