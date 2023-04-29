import { Type } from "@nestjs/common";
import { toCamelCase } from "../helpers";
import { FieldInfo, SchemaInfo } from "./schema";

export type AggregateMetadata = {
  vsn: number;
};

/**
 * Decorator for aggregate root. It is used to mark aggregate root class.
 * @constructor
 */
export function AggregateRoot<A>(vsn = 1) {
  return function (target: Type<A>) {
    const metadata = Reflect.getMetadata(AggregateRoot.META_KEY, target) ?? {};
    metadata.vsn = vsn;
    Reflect.defineMetadata(AggregateRoot.META_KEY, metadata, target);
  };
}

AggregateRoot.META_KEY = Symbol("aggregate::aggregateRoot");

/**
 * Decorator for aggregate model fields. It is used to define schema for the aggregate model.
 */
export type FieldMetadata<T> = {
  type?: () => T;
  allowNull?: boolean;
  default?: () => T;
  primary?: boolean;
  unique?: boolean;
};

export function Field<T>(opts?: FieldMetadata<any>): PropertyDecorator {
  return function (target: object, propertyKey: symbol | string) {
    const type = opts?.type
      ? opts.type
      : Reflect.getMetadata("design:type", target, String(propertyKey));
    if (type === undefined) {
      throw new Error(
        `Cannot deduce type for field \`${propertyKey.toString()}\` on \`${
          target.constructor.name
        }\`. ` +
          `Please specify the type explicitly using @Field({type: ...}) \n` +
          `If you are using TypeScript, make sure to enable \`emitDecoratorMetadata\` in \`tsconfig.json\` \n` +
          `See https://www.typescriptlang.org/docs/handbook/decorators.html#metadata for more information.`,
      );
    }

    const fieldInfo: FieldInfo<T> = {
      name: propertyKey as keyof T,
      type,
      allowNull: opts?.allowNull ?? false,
      default: opts?.default,
      primary: opts?.primary ?? false,
      unique: opts?.unique ?? false,
    };
    setFieldInfo(target.constructor as Type<T>, propertyKey, fieldInfo);
    const { fields } = getSchemaInfo<T>(target.constructor as Type<T>) ?? {
      fields: [],
    };
    fields.push(fieldInfo);
    setSchemaInfo(target.constructor as Type<T>, {
      fields,
    });
  };
}

Field.META_KEY = Symbol("aggregate::field");

export type EmbedsOneOpts<T> = {
  type?: Type<T>;
};

export function EmbedsOne<T>(opts?: EmbedsOneOpts<T>): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    opts = opts ?? {};
    if (!opts.type) {
      const type = Reflect.getMetadata("design:type", target, propertyKey);
      if (type === undefined) {
        throw new Error(
          `Cannot deduce type for field \`${propertyKey.toString()}\` on \`${
            target.constructor.name
          }\`. ` +
            `Please specify the type explicitly using @EmbedsOne({type: ...})`,
        );
      }
      opts.type = type;
    }
    Reflect.defineMetadata(
      EmbedsOne.META_KEY,
      opts,
      target.constructor,
      propertyKey,
    );
  };
}

EmbedsOne.META_KEY = Symbol("aggregate::embedsOne");

export type EmbedsManyOpts<T> = {
  type?: () => T;
  foreignKey?: (aggregateRoot: T) => T[keyof T];
};

export function EmbedsMany<T>(opts?: EmbedsManyOpts<T>): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    opts = opts ?? {};
    if (!opts.type) {
      const type = Reflect.getMetadata("design:type", target, propertyKey);
      if (type === undefined) {
        throw new Error(
          `Cannot deduce type for field \`${propertyKey.toString()}\` on \`${
            target.constructor.name
          }\`. ` +
            `Please specify the type explicitly using @EmbedsMany({type: ...})`,
        );
      }
      opts.type = type;
    }
    Reflect.defineMetadata(
      EmbedsMany.META_KEY,
      opts,
      target.constructor,
      propertyKey,
    );
  };
}

EmbedsMany.META_KEY = Symbol("aggregate::embedsMany");

// helper function that can conclude what should be field name of foreign key from given target type
export function getReferenceKey(constructorName: string): string {
  return `${toCamelCase(constructorName)}Id`;
}

const SCHEMA_INFO_KEY = Symbol("aggregate::schemaInfo");

// helped function that can get schema for given aggregate
export function getSchemaInfo<T>(target: Type<T>): SchemaInfo<T> {
  const schemaInfo = Reflect.getMetadata(
    SCHEMA_INFO_KEY,
    target,
  ) as SchemaInfo<T>;
  return schemaInfo;
}

function setSchemaInfo<T>(target: Type<T>, schemaInfo: SchemaInfo<T>) {
  Reflect.defineMetadata(SCHEMA_INFO_KEY, schemaInfo, target);
}

export function getFieldInfo<T, K extends keyof T>(
  target: Type<T>,
  propertyKey: K,
): FieldInfo<T> {
  return Reflect.getMetadata(
    Field.META_KEY,
    target,
    propertyKey as string | symbol,
  ) as FieldInfo<T>;
}

function setFieldInfo<T>(
  target: Type<T>,
  propertyKey: string | symbol,
  fieldInfo: FieldInfo<T>,
) {
  Reflect.defineMetadata(Field.META_KEY, fieldInfo, target, propertyKey);
}

export function getEmbedsOneFor<T extends Type<T>, K extends keyof T>(
  target: T,
  propertyKey: K,
): EmbedsOneOpts<T[K]> {
  return Reflect.getMetadata(
    EmbedsOne.META_KEY,
    target,
    propertyKey as string | symbol,
  );
}

export function getEmbedsManyFor<T, K extends keyof T>(
  target: Type<T>,
  propertyKey: K,
): EmbedsManyOpts<T[K]> {
  return Reflect.getMetadata(
    EmbedsMany.META_KEY,
    target,
    propertyKey as string | symbol,
  );
}

/**
 * Apply decorator marks method as an event listener. It is used in AggregateRoot
 * to mark methods that should be called when event is dispatched.
 */
export function Apply<T>(eventType: Type<T>): MethodDecorator {
  return function (target: object, propertyKey: string | symbol) {
    Reflect.defineMetadata(
      Apply.META_KEY,
      eventType,
      target.constructor,
      propertyKey,
    );
  };
}

Apply.META_KEY = Symbol("aggregate::apply");
