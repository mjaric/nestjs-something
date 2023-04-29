import { lastValueFrom } from "rxjs";
import { change } from "../src";
import { cast } from "../src";
import {
  validateConfirm,
  validateDate,
  validateDateTime,
  validateEmail,
  validateExclusion,
  validateFormat,
  validateInclusion,
  validateIp,
  validateIpv4,
  validateIpv6,
  validateLength,
  validateNumber,
  validateRequired,
  validateTime,
  validateUrl,
  validateUuid,
  validateAcceptance,
} from "../src/changeset/validators";

describe("changeset", () => {
  class Address {
    public addressLine!: string;
    public postCode!: string;
    public city!: string;
  }

  class User {
    public id!: number;
    public firstName!: string;
    public lastName!: string;
    public email!: string;
    public age!: number;
    public address!: Address;
  }

  let newUser: User;
  let existingUser: User;

  beforeEach(() => {
    newUser = new User();
    existingUser = new User();
    existingUser.id = 1;
    existingUser.firstName = "John";
    existingUser.lastName = "John";
    existingUser.email = "john.doe@example.com";
    existingUser.age = 30;
    existingUser.address = new Address();
    existingUser.address.addressLine = "123 Main St";
    existingUser.address.postCode = "12345";
    existingUser.address.city = "New York";

    return { newUser, existingUser };
  });

  describe("cast", () => {
    it("should cast only permitted changes", async () => {
      const changeset = change(newUser).pipe(
        cast(
          {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            address: {
              addressLine1: "123 Main St",
              postCode: "12345",
              city: "San Francisco",
            },
          },
          ["firstName", "lastName", "email"],
        ),
      );
      const result = await lastValueFrom(changeset);
      expect(result).toBeDefined();
      expect(result.data).toEqual({});
      expect(result.errors).toEqual({});
      expect(result.changes).toEqual({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
      });
    });

    it("should cast permitted and ignore empty params", async () => {
      const changeset = change(newUser).pipe(
        cast(
          {
            firstName: "John",
            lastName: "Doe",
            email: "",
            age: 0,
            address: {
              addressLine1: "123 Main St",
              postCode: "12345",
              city: "San Francisco",
            },
          },
          ["firstName", "lastName", "email", "age"],
          { empty: ["", undefined, 0] },
        ),
      );
      const result = await lastValueFrom(changeset);
      expect(result).toBeDefined();
      expect(result.data).toEqual({});
      expect(result.errors).toEqual({});
      expect(result.changes).toEqual({
        firstName: "John",
        lastName: "Doe",
      });
    });

    it("should cast all permitted even if equal when forced, but not empty params", async () => {
      newUser.age = 20;
      const changeset = change(newUser).pipe(
        cast(
          {
            firstName: "John",
            lastName: "Doe",
            email: "",
            age: 20,
            address: {
              addressLine1: "123 Main St",
              postCode: "12345",
              city: "San Francisco",
            },
          },
          ["firstName", "lastName", "email", "age"],
          { force: true, empty: ["", undefined] },
        ),
      );

      const result = await lastValueFrom(changeset);
      expect(result).toBeDefined();
      expect(result.data).toEqual({ age: 20 });
      expect(result.errors).toEqual({});
      expect(result.changes).toEqual({
        firstName: "John",
        lastName: "Doe",
        age: 20,
      });
    });

    it("should cast all permitted but skip empty and equal params", async () => {
      const changeset = change(existingUser).pipe(
        cast(
          {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            age: 30,
            address: {
              addressLine1: "123 Main St",
              postCode: "12345",
              city: "San Francisco",
            },
          },
          ["firstName", "lastName", "email", "age"],
          { empty: ["", undefined] },
        ),
      );
      const result = await lastValueFrom(changeset);
      expect(result).toBeDefined();
      expect(result.data).toEqual(existingUser);
      expect(result.errors).toEqual({});
      expect(result.changes).toEqual({
        lastName: "Doe",
      });
    });
  });

  describe("validations", () => {
    it("validateRequired should validate only permitted changes", async () => {
      const changeset = change(newUser).pipe(
        cast(
          {
            firstName: "John",
            lastName: undefined,
            email: "",
            age: 0,
            address: {
              addressLine1: "123 Main St",
              postCode: "12345",
              city: "San Francisco",
            },
          },
          ["firstName", "lastName", "email", "age"],
          { empty: ["", undefined, 0] },
        ),
        validateRequired("firstName"),
        validateRequired(["lastName"]),
        validateRequired(["email", "age"]),
      );

      const result = await lastValueFrom(changeset);
      expect(result).toBeDefined();
      expect(result.data).toEqual({});
      expect(result.errors).toEqual({
        email: [{ message: "can't be blank", validator: "required" }],
        age: [{ message: "can't be blank", validator: "required" }],
        lastName: [{ message: "can't be blank", validator: "required" }],
      });
      expect(result.changes).toEqual({
        firstName: "John",
      });
    });

    it("validateLength should validate only permitted changes", async () => {
      const params = {
        firstName: "John",
        lastName: "Doe",
        someNumber: 123,
        roles: [
          "admin",
          "user",
          "viewer",
          "tester",
          "developer",
          "manager",
          "owner",
          "guest",
          "supporter",
          "tester",
        ],
        obj: {
          key1: "value1",
          key2: "value2",
        },
      };
      const changeset = change(newUser).pipe(
        cast(params, ["firstName", "lastName", "roles", "obj", "someNumber"]),
        validateLength("firstName", { min: 5 }),
        validateLength("someNumber", { min: 5 }),
        validateLength("lastName", { min: 3, max: 10 }),
        validateLength("roles", { max: 3 }),
        validateLength("obj", { max: 1 }),
      );
      const result = await lastValueFrom(changeset);
      expect(result).toBeDefined();
      expect(result.data).toEqual({});
      expect(result.params).toEqual(params);
      expect(result.changes).toEqual({
        lastName: "Doe",
      });
      expect(result.errors).toEqual({
        firstName: [
          { message: "must be at least 5 characters", validator: "length" },
        ],
        roles: [{ message: "must be at most 3 elements", validator: "length" }],
        obj: [{ message: "is not string or array", validator: "length" }],
        someNumber: [
          { message: "is not string or array", validator: "length" },
        ],
      });
    });

    it("validateFormat should validate only permitted changes", async () => {
      const params = {
        randomFalseIp: "not valid",
        randomIpv4: "192.168.0.1",
        randomIpv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        randomEmail: "prefix-infix.sufix@exmaple.com",
        falseEmail: "falsy-email",
        randomUrl: "https://example.com",
        falseUrl: "not a url",
        randomUuid: "123e4567-e89b-12d3-a456-426614174000",
        falseUuid: "not a uuid",
        someDate: "2021-01-01",
        someTime: "12:00:00",
        falseDate: "not a date",
        falseTime: "not a time",
        someDateTime: "2021-01-01T12:00:00.000Z",
        someDateTimeShorter: "2021-01-01T12:00:00",
        falseDateTime: "not a date time",
        arrayField: {
          randomFalseIp: "not valid",
          randomIpv4: "another ip",
        },
      };

      const permitted = Object.keys(params) as (keyof typeof params)[];
      const changeset = change({}).pipe(
        cast(params, permitted),
        validateIp(["randomFalseIp", "randomIpv4", "randomIpv6"]),
        validateEmail(["randomEmail", "falseEmail"]),
        validateUrl(["randomUrl", "falseUrl"]),
        validateUuid(["randomUuid", "falseUuid"]),
        validateFormat("arrayField", { fmt: /ip/ }),
      );

      const result = await lastValueFrom(changeset);

      expect(result).toBeDefined();
      expect(result.data).toEqual({});
      expect(result.params).toEqual(params);
      expect(result.changes).toEqual({
        falseDate: "not a date",
        falseDateTime: "not a date time",
        falseTime: "not a time",
        randomEmail: "prefix-infix.sufix@exmaple.com",
        randomIpv4: "192.168.0.1",
        randomIpv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        randomUrl: "https://example.com",
        randomUuid: "123e4567-e89b-12d3-a456-426614174000",
        someDate: "2021-01-01",
        // iso8601
        someDateTime: "2021-01-01T12:00:00.000Z",
        someDateTimeShorter: "2021-01-01T12:00:00",
        someTime: "12:00:00",
      });
      expect(result.errors).toEqual({
        randomFalseIp: [{ message: "is not valid.", validator: "format" }],
        falseEmail: [{ message: "is not valid.", validator: "format" }],
        falseUrl: [{ message: "is not valid.", validator: "format" }],
        falseUuid: [{ message: "is not valid.", validator: "format" }],
        arrayField: [{ message: "is not a string.", validator: "format" }],
      });

      const changeset2 = change({}).pipe(
        cast(params, [
          "randomFalseIp",
          "randomIpv4",
          "randomIpv6",
          "someDateTime",
          "someDate",
          "someTime",
          "falseDate",
          "falseTime",
          "falseDateTime",
          "someDateTimeShorter",
        ]),
        validateIpv4(["randomFalseIp", "randomIpv4"]),
        validateIpv6("randomIpv6"),
        validateDate(["someDate", "falseDate"]),
        validateTime(["someTime", "falseTime"]),
        validateDateTime(["someDateTime", "falseDateTime"]),
      );

      const result2 = await lastValueFrom(changeset2);
      expect(result2).toBeDefined();
      expect(result2.data).toEqual({});
      expect(result2.params).toEqual(params);
      expect(result2.changes).toEqual({
        randomIpv4: "192.168.0.1",
        randomIpv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        someDate: "2021-01-01",
        someTime: "12:00:00",
        someDateTime: "2021-01-01T12:00:00.000Z",
        someDateTimeShorter: "2021-01-01T12:00:00",
      });
      expect(result2.errors).toEqual({
        randomFalseIp: [{ message: "is not valid.", validator: "format" }],
        falseDate: [{ message: "is not valid.", validator: "format" }],
        falseTime: [{ message: "is not valid.", validator: "format" }],
        falseDateTime: [{ message: "is not valid.", validator: "format" }],
      });
    });

    it("validateInclusion should validate only permitted changes", async () => {
      const params = {
        someNumber: 1,
        someString: "some string",
        someNull: null,
        someUndefined: undefined,
      };

      const changeset = change({}).pipe(
        cast(params, ["someNumber", "someString", "someNull", "someUndefined"]),
        validateInclusion("someNumber", { in: [1, 2, 3] }),
        validateInclusion("someString", {
          in: ["some string", "another string"],
        }),
        validateInclusion("someNull", { in: ["some string"] }),
        validateInclusion("someUndefined", { in: ["some string"] }),
      );

      const result = await lastValueFrom(changeset);
      expect(result).toBeDefined();
      expect(result.data).toEqual({});
      expect(result.params).toEqual(params);
      expect(result.changes).toEqual({
        someNumber: 1,
        someString: "some string",
      });
      expect(result.errors).toEqual({
        someNull: [
          {
            message: "should be one of: some string",
            validator: "inclusion",
            in: ["some string"],
          },
        ],
        someUndefined: [
          {
            message: "should be one of: some string",
            validator: "inclusion",
            in: ["some string"],
          },
        ],
      });
    });

    it("validateNumber should validate only permitted changes", async () => {
      const params = {
        someNumber: 1,
        someString: "some string",
        notInRange1: 0,
        notInRange2: 11,
        notInRange3: 23,
        notInRange4: 3,
      };

      const changeset = change({}).pipe(
        cast(params, [
          "someNumber",
          "someString",
          "notInRange1",
          "notInRange2",
        ]),
        validateNumber("someNumber", { eq: 2, message: "should be 2" }),
        validateNumber("someString", { eq: 1, message: "should be ${eq}" }),
        validateNumber("notInRange1", { gt: 1, lt: 10 }),
        validateNumber("notInRange2", { gte: 1, lte: 10 }),
      );

      const result = await lastValueFrom(changeset);
      expect(result).toBeDefined();
      expect(result.data).toEqual({});
      expect(result.params).toEqual(params);
      expect(result.changes).toEqual({});
      expect(result.errors).toEqual({
        someNumber: [{ message: "should be 2", validator: "number", eq: 2 }],
        someString: [
          { message: "is not a number", validator: "number", eq: 1 },
        ],
        notInRange1: [
          {
            message: "must be greater than 1",
            validator: "number",
            gt: 1,
            lt: 10,
          },
        ],
        notInRange2: [
          {
            message: "must be less than or equal to 10",
            validator: "number",
            gte: 1,
            lte: 10,
          },
        ],
      });
    });

    const faultyValidateNumberOpts = [
      {
        opts: {},
        message:
          "validateNumber: at least one of `gt`, `gte`, `lt`, `lte` or `eq` must be configured",
      },
      {
        opts: { message: "should be 2" },
        message:
          "validateNumber: at least one of `gt`, `gte`, `lt`, `lte` or `eq` must be configured",
      },
      {
        opts: { gt: 10, lt: 1 },
        message: "validateNumber: `gt` must be lower than `lt`",
      },
      {
        opts: { gte: 10, lte: 1 },
        message: "validateNumber: `gte` must be lower than `lte`",
      },
      {
        opts: { gte: 10, lt: 1 },
        message: "validateNumber: `gte` must be lower than `lt`",
      },
      {
        opts: { gt: 10, lte: 1 },
        message: "validateNumber: `gt` must be lower than `lte`",
      },
      {
        opts: { gt: 1, gte: 1 },
        message: "validateNumber: `gt` and `gte` can't be configured together",
      },
      {
        opts: { lt: 1, lte: 1 },
        message: "validateNumber: `lt` and `lte` can't be configured together",
      },
      {
        opts: { eq: 1, gte: 1 },
        message:
          "validateNumber: `eq` can't be configured with `gt`, `gte`, `lt` or `lte`",
      },
    ];

    it.each(faultyValidateNumberOpts)(
      "validateNumber should throw error if used incorrectly %j",
      async (item) => {
        const { opts, message } = item;
        const params = {
          someNumber: 1,
        };

        try {
          change({}).pipe(
            cast(params, ["someNumber"]),
            validateNumber("someNumber", opts),
          );
        } catch (e) {
          if (e instanceof Error) {
            expect(e.message).toEqual(message);
          } else {
            fail("should throw an error");
          }
        }
      },
    );

    it("validateExclusion should validate only permitted changes", async () => {
      const params = {
        someNumber: 1,
        someNumber2: 2,
      };

      const changeset = change({}).pipe(
        cast(params, ["someNumber", "someNumber2"]),
        validateExclusion("someNumber", { notIn: [2, 3] }),
        validateExclusion("someNumber2", { notIn: [1, 2, 3] }),
      );

      const result = await lastValueFrom(changeset);
      expect(result).toBeDefined();
      expect(result.data).toEqual({});
      expect(result.params).toEqual(params);
      expect(result.changes).toEqual({
        someNumber: 1,
      });
      expect(result.errors).toEqual({
        someNumber2: [
          {
            message: "should not be one of: 1, 2, 3",
            validator: "exclusion",
            notIn: [1, 2, 3],
          },
        ],
      });
    });

    it("validateConfirm should validate only permitted changes", async () => {
      const params = {
        password: "password",
        passwordConfirmation: "password",
        email: "email@example.com",
        emailConfirm: "other@example.com",
        pinCode: "1234",
        pinCodeConfirm: "2234",
      };

      const changeset = change({}).pipe(
        cast(params, ["password"]),
        validateConfirm("password", { confirm: "passwordConfirmation" }),
        validateConfirm("email"),
        validateConfirm("pinCode", { message: "should match" }),
      );

      const result = await lastValueFrom(changeset);
      expect(result).toBeDefined();
      expect(result.data).toEqual({});
      expect(result.params).toEqual(params);
      expect(result.changes).toEqual({
        password: "password",
      });
      expect(result.errors).toEqual({
        email: [
          {
            message: "doesn't match",
            validator: "confirm",
            confirm: "emailConfirm",
          },
        ],
        pinCode: [
          {
            message: "should match",
            validator: "confirm",
            confirm: "pinCodeConfirm",
          },
        ],
      });
    });

    // test cases for validateAcceptance
    it("validateAcceptance should validate only permitted changes", async () => {
      const params = {
        someBoolean: true,
        someBoolean2: false,
        someBoolean3: "true",
        someBoolean4: "1",
        someBoolean5: 1,
        someBoolean6: "false",
        someBoolean7: "Yes",
        someBoolean8: "I don't care",
      };

      const changeset = change({}).pipe(
        cast(params, [
          "someBoolean",
          "someBoolean2",
          "someBoolean3",
          "someBoolean4",
          "someBoolean5",
          "someBoolean6",
          "someBoolean7",
          "someBoolean8",
        ]),
        validateAcceptance("someBoolean"),
        validateAcceptance("someBoolean2", { message: "should be accepted" }),
        validateAcceptance("someBoolean3", { message: "should be accepted" }),
        validateAcceptance("someBoolean4", { message: "should be accepted" }),
        validateAcceptance("someBoolean5", { message: "should be accepted" }),
        validateAcceptance("someBoolean6", { message: "should be accepted" }),
        validateAcceptance("someBoolean7", {
          message: "should be accepted",
          truthy: ["Yes"],
        }),
        validateAcceptance("someBoolean8", {
          message: "should be accepted with `Yes`",
          truthy: ["Yes"],
        }),
      );

      const result = await lastValueFrom(changeset);
      expect(result).toBeDefined();
      expect(result.data).toEqual({});
      expect(result.params).toEqual(params);
      expect(result.changes).toEqual({
        someBoolean: true,
        someBoolean3: "true",
        someBoolean4: "1",
        someBoolean5: 1,
        someBoolean7: "Yes",
      });
      expect(result.errors).toEqual({
        someBoolean2: [
          {
            message: "should be accepted",
            validator: "acceptance",
            truthy: [true, "true", 1, "1"],
          },
        ],
        someBoolean6: [
          {
            message: "should be accepted",
            validator: "acceptance",
            truthy: [true, "true", 1, "1"],
          },
        ],
        someBoolean8: [
          {
            message: "should be accepted with `Yes`",
            validator: "acceptance",
            truthy: ["Yes"],
          },
        ],
      });
    });
  });
});
