import { Type } from "@nestjs/common";
import { toCamelCase } from "../helpers";
import { FieldInfo, SchemaInfo } from "./schema";

/** @hidden */
const AGGREGATE_ROOT_META_KEY = Symbol("aggregate::aggregateRoot");

export type AggregateMetadata = {
  vsn: number;
};

/**
 * Class decorator for aggregate root. It is used to mark aggregate as root of domain.
 */
export function AggregateRoot(vsn = 1): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function <A extends Function>(target: A) {
    const metadata = Reflect.getMetadata(AGGREGATE_ROOT_META_KEY, target) ?? {};
    metadata.vsn = vsn;
    Reflect.defineMetadata(AGGREGATE_ROOT_META_KEY, metadata, target);
  };
}

/**
 * Type that can extract field metadata from the class/aggregate.
 *
 * @property type - Type of the field. Should be used if type cannot be deduced from the property.
 * Usually it is required for nullable or fields that can be undefined.
 * @property allowNull - Whether field can be null. Default is false.
 * @property default - Default value for the field. Will be used during creation of the aggregate.
 * @property primary - Whether field is primary key. Default is false.
 */
export type FieldMetadata = {
  /**
   * Type of the field. Should be used if type cannot be deduced from the property.
   * Usually it is required for nullable or fields that can be undefined.
   */
  type?: () => unknown;
  /**
   * Whether field can be null.
   */
  allowNull?: boolean;
  /**
   * Default value for the field. Will be used during creation of the aggregate.
   */
  default?: () => unknown;
  /**
   * Whether field is primary key. Default is false.
   */
  primary?: boolean;
  /**
   * Whether field is unique. Default is false.
   */
  unique?: boolean;
};

/**
 * @title Field decorator
 * Decorator for aggregate model fields. It is used to define schema for the aggregate model.
 * @param opts
 * @constructor
 */
export function Field(opts?: FieldMetadata): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
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

    const fieldInfo = {
      name: propertyKey.toString(),
      type,
      allowNull: opts?.allowNull ?? false,
      default: opts?.default,
      primary: opts?.primary ?? false,
      unique: opts?.unique ?? false,
    };
    setFieldInfo<unknown>(
      target.constructor as Type<unknown>,
      propertyKey,
      fieldInfo as FieldInfo<unknown>,
    );
    const { fields } = getSchemaInfo(target.constructor as Type<unknown>) ?? {
      fields: [],
    };
    fields.push(fieldInfo as FieldInfo<unknown>);
    setSchemaInfo(target.constructor as Type<unknown>, {
      fields,
    });
  };
}

const EMBEDS_ONE_META_KEY = Symbol("aggregate::embedsOne");

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
      EMBEDS_ONE_META_KEY,
      opts,
      target.constructor,
      propertyKey,
    );
  };
}

export type EmbedsManyOpts<T> = {
  type?: () => T;
  foreignKey?: (aggregateRoot: T) => T[keyof T];
};

const EMBEDS_MANY_META_KEY = Symbol("aggregate::embedsMany");

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
      EMBEDS_MANY_META_KEY,
      opts,
      target.constructor,
      propertyKey,
    );
  };
}

// helper function that can conclude what should be field name of foreign key from given target type
export function getReferenceKey(constructorName: string): string {
  return `${toCamelCase(constructorName)}Id`;
}

/** @hidden */
const SCHEMA_INFO_KEY = Symbol("aggregate::schemaInfo");

/**
 * helped function that can get schema for given aggregate model
 * @param target
 */
export function getSchemaInfo<T>(target: Type<T>): SchemaInfo<T> {
  return Reflect.getMetadata(SCHEMA_INFO_KEY, target) as SchemaInfo<T>;
}

/**
 * Helper function that can get AggregateRoot schema version and schema info
 */
export function getAggregateRootInfo<T>(
  target: Type<T>,
): (SchemaInfo<T> & { vsn: number }) | undefined {
  const rootInfo = Reflect.getMetadata(AGGREGATE_ROOT_META_KEY, target);
  if (rootInfo === undefined) {
    return undefined;
  }
  const schema = getSchemaInfo(target);
  return { ...rootInfo, ...schema };
}

function setSchemaInfo<T>(target: Type<T>, schemaInfo: SchemaInfo<T>) {
  Reflect.defineMetadata(SCHEMA_INFO_KEY, schemaInfo, target);
}

const FIELD_META_KEY = Symbol("aggregate::field");

export function getFieldInfo<T, K extends keyof T>(
  target: Type<T>,
  propertyKey: K,
): FieldInfo<T> {
  return Reflect.getMetadata(
    FIELD_META_KEY,
    target,
    propertyKey as string | symbol,
  ) as FieldInfo<T>;
}

function setFieldInfo<T>(
  target: Type<T>,
  propertyKey: string | symbol,
  fieldInfo: FieldInfo<T>,
) {
  Reflect.defineMetadata(
    FIELD_META_KEY,
    fieldInfo,
    target,
    String(propertyKey),
  );
}

export function getEmbedsOneFor<T extends Type<T>, K extends keyof T>(
  target: T,
  propertyKey: K,
): EmbedsOneOpts<T[K]> {
  return Reflect.getMetadata(
    EMBEDS_ONE_META_KEY,
    target,
    propertyKey as string | symbol,
  );
}

export function getEmbedsManyFor<T, K extends keyof T>(
  target: Type<T>,
  propertyKey: K,
): EmbedsManyOpts<T[K]> {
  return Reflect.getMetadata(
    EMBEDS_MANY_META_KEY,
    target,
    propertyKey as string | symbol,
  );
}

const APPLY_META_KEY = Symbol("aggregate::apply");
/**
 * Apply decorator marks method as an event listener. It is used in AggregateRoot
 * to mark methods that should be called when event is dispatched.
 */
export function Apply<T>(eventType: Type<T>): MethodDecorator {
  return function (target: object, propertyKey: string | symbol) {
    Reflect.defineMetadata(
      APPLY_META_KEY,
      eventType,
      target.constructor,
      propertyKey,
    );
  };
}
