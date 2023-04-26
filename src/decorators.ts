import { Type } from "@nestjs/common";

/**
 * Decorator for aggregate root. It is used to mark aggregate root class.
 * @constructor
 */
export function AggregateRoot<A>() {
  return function (target: Type<A>) {
    Reflect.defineMetadata(AggregateRoot.META_KEY, true, target);
  };
}
AggregateRoot.META_KEY = Symbol("aggregate::aggregateRoot");

/**
 * Decorator for aggregate model fields. It is used to define schema for the aggregate model.
 */
export type FieldMetadata<T> = {
  type?: () => T;
  nullable?: boolean;
  defaultValue?: T | (() => T);
  primary?: boolean;
};

export function Field<T>(opts?: FieldMetadata<T>): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    if (!opts?.type) {
      const type = Reflect.getMetadata("design:type", target, propertyKey);
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
      opts = { ...(opts ?? {}), type };
    }
    Reflect.defineMetadata(
      Field.META_KEY,
      opts,
      target.constructor,
      propertyKey,
    );
  };
}

Field.META_KEY = Symbol("aggregate::field");

export type EmbedsOneOpts<T> = {
  type?: Type<T>;
  nullable?: boolean;
  foreignKey?: (other: T) => T[keyof T];
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
    if (!opts.foreignKey) {
      opts.foreignKey = (other: T) =>
        other[getReferenceKey(target.constructor.name)];
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
      opts.type = Reflect.getMetadata("design:type", target, propertyKey);
    }
    if (!opts.foreignKey) {
      opts.foreignKey = (other: T) =>
        other[getReferenceKey(target.constructor.name)];
    }
    Reflect.defineMetadata(
      EmbedsMany.META_KEY,
      opts,
      target.constructor,
      propertyKey,
    );
    // todo: not sure if this is needed, since this is reference, not a value
    //       still, it might be useful to have this information in the schema
    //       so that we can use it in validation such as `validate_length`
    //       if this is not needed, then we can remove this
    // also define field for this property
    // Reflect.defineMetadata('aggregate::field', {
    //     type: Array,
    //     nullable: false,
    //     defaultValue: () => [],
    // }, target, propertyKey);
  };
}

EmbedsMany.META_KEY = Symbol("aggregate::embedsMany");

// helper function that can conclude what should be field name of foreign key from given target type
export function getReferenceKey(constructorName: string): string {
  return `${toCamelcase(constructorName)}Id`;
}

export function toCamelcase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
}

// helped function that can get schema for given aggregate
export function getAggregateSchema<T>(
  target: Type<T>,
): Map<string, FieldMetadata<T[keyof T]>> {
  const fields = Reflect.getMetadata(Field.META_KEY, target) as Map<
    string,
    FieldMetadata<T[keyof T]>
  >;
  const embedsOne = Reflect.getMetadata(EmbedsOne.META_KEY, target) as Map<string, EmbedsOneOpts<T[keyof T]>>;
  const embedsMany = Reflect.getMetadata(EmbedsMany.META_KEY, target) as Map<string, EmbedsManyOpts<T[keyof T]>>;

  return {
    ...fields,
    ...embedsOne,
    ...embedsMany,
  };
}

export function getEmbedsOneFor(
  target: Type<any>,
  propertyKey: string | symbol,
): EmbedsOneOpts<any> {
  return Reflect.getMetadata(EmbedsOne.META_KEY, target, propertyKey);
}

export function getEmbedsManyFor(
  target: Type<any>,
  propertyKey: string | symbol,
): EmbedsManyOpts<any> {
  return Reflect.getMetadata(EmbedsMany.META_KEY, target, propertyKey);
}



// helper function that get
