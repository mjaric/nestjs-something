import { Changeset, Change, FieldChange } from "../src/changeset";
import { describe } from "node:test";


describe("Changeset", () => {
  const data = { name: "John", age: 30 };
  it("should create a changeset", () => {
    const changeset = Changeset.change(data);

    expect(changeset).toBeDefined();
    expect(changeset.data).toEqual({ name: "John", age: 30 });
    expect(changeset.errors).toEqual({});
  });

  it("should cast a changeset", () => {
    const changeset = Changeset.change(data);
    const changeset2 = changeset
      .cast({ name: "John", age: 30 }, ["name", "age"]);

    expect(changeset2).toBeDefined();
    expect(changeset2.changes.size).toEqual(0);
    expect(changeset2.data).toEqual({ name: "John", age: 30 });
    expect(changeset2.getChange("name")).toEqual(undefined);
    expect(changeset2.getChange("age")).toEqual(undefined);
    expect(changeset2.errors).toEqual({});
  });

  it("should not cast a changeset with forced=true options", () => {
    const changeset = Changeset.change(data);
    const changeset2 = changeset
      .cast({ name: "John", age: 30 }, ["name", "age"], { force: true });

    expect(changeset2).toBeDefined();
    expect(changeset2.changes.size).toEqual(2);
    expect(changeset2.data).toEqual({ name: "John", age: 30 });
    expect(changeset2.getChange("name"))
      .toEqual(new FieldChange("name", "John", "John"));
    expect(changeset2.getChange("age"))
      .toEqual(new FieldChange("age", 30, 30));
    expect(changeset2.getChange("falseField")).toBeUndefined();
    expect(changeset2.errors).toEqual({});
  });

  it("should cast fields that are not in data", () => {
    const changeset = Changeset.change(data);
    const changeset2 = changeset
      .cast({ name: "John", age: 30, newField: "new" }, ["name", "age", "newField"], { force: false });

    expect(changeset2).toBeDefined();
    expect(changeset2.changes.size).toEqual(1);
    expect(changeset2.getChange("newField"))
      .toEqual(new FieldChange("newField", "new", undefined));
    expect(changeset2.data).toEqual({ name: "John", age: 30 });
    expect(changeset2.getChange("name")).toBeUndefined();
    expect(changeset2.getChange("age")).toBeUndefined();
    expect(changeset2.getChange("falseField")).toBeUndefined()
    expect(changeset2.errors).toEqual({});
  });
});