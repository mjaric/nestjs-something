import { Observable } from "rxjs";
import { Changeset, Model, Params } from "./changeset";
import { map } from "rxjs/operators";
import { asPlural, pluralize } from "../helpers";
import { ValidationError } from "@nestjs/common";

export enum Validator {
  required = "required",
  number = "number",
  length = "length",
  format = "format",
  confirm = "confirm",
  inclusion = "inclusion",
  exclusion = "exclusion",
  subset = "subset",
  acceptance = "acceptance",
}

export type Error =
  | { validator: Validator.required; message: string }
  | ({ validator: Validator.number; message: string } & ValidateNumberOpts)
  | { validator: Validator.length; message: string; min?: number; max?: number }
  | { validator: Validator.format; message: string }
  | { validator: Validator.inclusion; message: string; in: Array<unknown> }
  | { validator: Validator.exclusion; message: string; notIn: Array<unknown> }
  | { validator: Validator.confirm; message: string; confirm: any }
  | { validator: Validator.subset; message: string }
  | { validator: Validator.acceptance; message: string; truthy: Array<unknown> }
  // everything below is not implemented yet, left for extensions
  | { validator: string; message: string; opts: unknown };
export type Errors<T> = Partial<{
  [key in keyof T]: Array<Error>;
}>;

/**
 * Required validator.
 * @param fields - Fields to be validated. Can be string array or string.
 * @param opts - Options. Can be used to override default error message.
 * @param opts.message - Error message. Default is "can't be blank".
 * @returns Observable of changeset.
 */
export function validateRequired<M extends Model<M>, P extends Params<P>>(
  fields: keyof P | Array<keyof P>,
  opts?: { message?: string },
) {
  return (source: Observable<Changeset<M, P>>): Observable<Changeset<M, P>> => {
    return source.pipe(
      map(({ changes, params, data, errors }) => {
        const message = opts?.message ?? "can't be blank";
        const validator = Validator.required;
        const fieldsArray = Array.isArray(fields)
          ? (fields as Array<keyof P>)
          : [fields];
        fieldsArray.forEach((field) => {
          if (
            changes[field] === undefined ||
            changes[field] === null ||
            changes[field] === ""
          ) {
            delete changes[field];
            errors[field] = [{ validator, message }];
          }
        });
        return { changes, params, data, errors };
      }),
    );
  };
}

export type ValidateNumberOpts = {
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  eq?: number;
  message: string;
};

/**
 * Number validator. Checks if value is a number and in configured range.
 * If range is not configured, only checks if value is a number.
 * @param field - Field to be validated.
 * @param opts - Options. Can be used to override default error message.
 * @param opts.eq - Checks if value is equal to this number.
 * @param opts.gt - Checks if value is greater than this number.
 * @param opts.gte - Checks if value is greater than or equal to this number.
 * @param opts.lt - Checks if value is less than this number.
 * @param opts.lte - Checks if value is less than or equal to this number.
 * @param opts.message - Error message. Can be used to override default error
 *                        message which is "is not a number",
 *                        or "must be greater than ${gt}" etc.
 * @returns Observable of changeset.
 * @throws Error if `gt` and `gte` are configured together.
 * @throws Error if `lt` and `lte` are configured together.
 * @throws Error if `eq` is configured with `gt`, `gte`, `lt` or `lte`.
 * @throws Error if none of `gt`, `gte`, `lt`, `lte` or `eq` are configured.
 */
export function validateNumber<M extends Model<M>, P extends Params<P>>(
  field: keyof P,
  opts?: Partial<ValidateNumberOpts>,
) {
  const validOpts = [opts?.gte, opts?.gt, opts?.lte, opts?.lt, opts?.eq].some(
    (value) => undefined !== value,
  );
  if (!validOpts) {
    throw new Error(
      "validateNumber: at least one of `gt`, `gte`, `lt`, `lte` or `eq` must be configured",
    );
  }
  if (opts?.gt !== undefined && opts.gte !== undefined) {
    throw new Error(
      "validateNumber: `gt` and `gte` can't be configured together",
    );
  }
  if (opts?.lt !== undefined && opts.lte !== undefined) {
    throw new Error(
      "validateNumber: `lt` and `lte` can't be configured together",
    );
  }
  if (
    opts?.eq !== undefined &&
    (opts.gt !== undefined ||
      opts.gte !== undefined ||
      opts.lt !== undefined ||
      opts.lte !== undefined)
  ) {
    throw new Error(
      "validateNumber: `eq` can't be configured with `gt`, `gte`, `lt` or `lte`",
    );
  }
  if (opts?.gt !== undefined && opts.lt !== undefined && opts.gt >= opts.lt) {
    throw new Error("validateNumber: `gt` must be lower than `lt`");
  }
  if (
    opts?.gte !== undefined &&
    opts.lte !== undefined &&
    opts.gte >= opts.lte
  ) {
    throw new Error("validateNumber: `gte` must be lower than `lte`");
  }
  if (opts?.gt !== undefined && opts.lte !== undefined && opts.gt >= opts.lte) {
    throw new Error("validateNumber: `gt` must be lower than `lte`");
  }
  if (opts?.gte !== undefined && opts.lt !== undefined && opts.gte >= opts.lt) {
    throw new Error("validateNumber: `gte` must be lower than `lt`");
  }
  return (source: Observable<Changeset<M, P>>): Observable<Changeset<M, P>> => {
    return source.pipe(
      map(({ data, changes, errors, params }) => {
        opts = opts ?? { message: "is not a number" };
        const validator = Validator.number;
        const value = changes[field];
        if (value === undefined || value === null || value === "") {
          return { changes, errors, params, data };
        }
        // sometimes number is string, eg. decimal number, we don't care about storage format
        // we only care about validation
        const mustBeNumber = Number(value);
        if (isNaN(mustBeNumber)) {
          delete changes[field];
          errors[field] = [{ validator, ...opts, message: "is not a number" }];
          return { data, changes, errors, params };
        }

        // if we check for equality only, then check it and return
        if (opts.eq !== undefined && value !== opts.eq) {
          delete changes[field];
          const message = (opts.message ?? "must be equal to ${eq}").replace(
            "${eq}",
            opts.eq.toString(),
          );
          errors[field] = [{ validator, ...opts, message }];
          return { data, changes, errors, params };
        }
        const innerErrors: Error[] = [];
        // if we check for gt, gte, lt, lte, then check it and return
        if (opts.lt !== undefined && mustBeNumber >= opts.lt) {
          const message = (opts.message ?? "must be less than ${lt}").replace(
            "${lt}",
            opts.lt.toString(),
          );
          innerErrors.push({ validator, ...opts, message });
        }
        if (opts.lte !== undefined && mustBeNumber > opts.lte) {
          const message = (
            opts.message ?? "must be less than or equal to ${lte}"
          ).replace("${lte}", opts.lte.toString());
          innerErrors.push({ validator, ...opts, message });
        }
        if (opts.gt !== undefined && mustBeNumber <= opts.gt) {
          const message = (
            opts.message ?? "must be greater than ${gt}"
          ).replace("${gt}", opts.gt.toString());
          innerErrors.push({ validator, ...opts, message });
        }
        if (opts.gte !== undefined && mustBeNumber < opts.gte) {
          const message = (
            opts.message ?? "must be greater than or equal to ${gte}"
          ).replace("${gte}", opts.gte.toString());
          innerErrors.push({ validator, ...opts, message });
        }

        if (Array.isArray(innerErrors)) {
          delete changes[field];
          errors[field] = innerErrors;
        }
        return { data, changes, errors, params };
      }),
    );
  };
}

/**
 * Length validator. Checks if value length is in configured range.
 * If range is not configured, only checks if value is not empty. Can be used for string and array.
 * @param field - Field to be validated.
 * @param opts - Options. Can be used to override default error message.
 * @param opts.min - Checks if value length is greater than or equal to this number.
 * @param opts.max - Checks if value length is less than or equal to this number.
 * @param opts.message - Error message. Can be used to override default error message which is "is too short
 *                      (minimum is ${min} characters)" or "is too long (maximum is ${max} characters)".
 */
export function validateLength<M extends Model<M>, P extends Params<P>>(
  field: keyof P,
  opts?: { min?: number; max?: number; message?: string },
) {
  if (opts?.min === undefined && opts?.max === undefined) {
    throw new Error("validateLength: at least min or max must be defined");
  }
  if (opts?.min && opts?.max && opts?.min > opts?.max) {
    throw new Error("validateLength: min must be less than max");
  }

  return (source: Observable<Changeset<M, P>>): Observable<Changeset<M, P>> => {
    return source.pipe(
      map(({ params, data, errors, changes }) => {
        const validator = Validator.length;
        const value = changes[field] as string | Array<unknown>;
        if (value === undefined || value === null || value === "") {
          return { params, data, errors, changes };
        }
        const isArray = Array.isArray(value);
        if (typeof value !== "string" && !isArray) {
          delete changes[field];
          errors[field] = [
            ...(errors[field] ?? []),
            { validator, message: "is not string or array" },
          ];
          return { params, data, errors, changes };
        }
        if (opts.min !== undefined && value.length < opts.min) {
          delete changes[field];
          let element = isArray ? "element" : "character";
          element = pluralize(element, opts.min);
          const message =
            opts?.message ?? `must be at least \${min} ${element}`;
          errors[field] = [
            ...(errors[field] ?? []),
            {
              validator,
              message: message.replace("${min}", opts.min.toString()),
            },
          ];
        }
        if (opts.max !== undefined && value.length > opts.max) {
          delete changes[field];
          let element = isArray ? "element" : "character";
          element = pluralize(element, opts.max);
          const message = opts?.message ?? `must be at most \${max} ${element}`;
          errors[field] = [
            ...(errors[field] ?? []),
            {
              validator,
              message: message.replace("${max}", opts.max.toString()),
            },
          ];
        }
        return { params, data, errors, changes };
      }),
    );
  };
}

const FORMATS = {
  email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
  url: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i,
  // ipv4 or ipv6 format
  ip: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/,
  ipv4: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
  ipv6: /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/,
  uuid: /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/,
  date: /^\d{2,4}-\d{1,2}-\d{1,2}$/,
  time: /^\d{1,2}:\d{1,2}:\d{1,2}$/,
  // iso 8601 datetime format
  dateTime:
    /^\d{2,4}-\d{1,2}-\d{1,2}T\d{1,2}:\d{1,2}:\d{1,2}(\.\d+)?(Z|[+-]\d{1,2}:\d{1,2})?$/,
};

/**
 * Format (Regex) validator. Checks if value matches configured regex.
 * @param field - Field to be validated.
 * @param opts - Options. Can be used to override default error message.
 * @param opts.fmt - Regex to be matched.
 * @param opts.message - Error message. Can be used to override default error message which is "is invalid".
 */
export function validateFormat<M extends Model<M>, P extends Params<P>>(
  field: keyof P | Array<keyof P>,
  opts: { fmt: RegExp; message?: string },
) {
  return (source: Observable<Changeset<M, P>>): Observable<Changeset<M, P>> => {
    return source.pipe(
      map((changeset) => {
        const validator = Validator.format;
        const fields = !Array.isArray(field) ? [field] : field;
        return fields.reduce(({ params, data, errors, changes }, f) => {
          const value = changes[f];
          if (value === undefined || value === null || value === "") {
            return { params, data, errors, changes };
          }
          if (typeof value !== "string") {
            delete changes[f];
            errors[f] = [
              ...(errors[f] ?? []),
              { validator, message: "is not a string." },
            ];
            return { params, data, errors, changes };
          }
          if (!opts.fmt.test(value)) {
            delete changes[f];
            errors[f] = [
              ...(errors[f] ?? []),
              { validator, message: opts?.message ?? "is not valid." },
            ];
          }
          return { params, data, errors, changes };
        }, changeset);
      }),
    );
  };
}

/**
 * Validates if value is email.
 * @param field - Field to be validated.
 * @param message - Error message. Can be used to override default error message which is "is invalid".
 */
export function validateEmail<M extends Model<M>, P extends Params<P>>(
  field: keyof P | Array<keyof P>,
  message?: string,
) {
  return validateFormat(field, { fmt: FORMATS.email, message });
}

/**
 * Validates if value is url.
 * @param field - Field to be validated.
 * @param message - Error message. Can be used to override default error message which is "is invalid".
 */
export function validateUrl<M extends Model<M>, P extends Params<P>>(
  field: keyof P | Array<keyof P>,
  message?: string,
) {
  return validateFormat<M, P>(field, { fmt: FORMATS.url, message });
}

/**
 * Validates if value is ip.
 * @param field - Field to be validated.
 * @param message - Error message. Can be used to override default error message which is "is invalid".
 */
export function validateIp<M extends Model<M>, P extends Params<P>>(
  field: keyof P | Array<keyof P>,
  message?: string,
) {
  return validateFormat(field, { fmt: FORMATS.ip, message });
}

/**
 * Validates if value is ipv4.
 * @param field - Field to be validated.
 * @param message - Error message. Can be used to override default error message which is "is invalid".
 */
export function validateIpv4<M extends Model<M>, P extends Params<P>>(
  field: keyof P | Array<keyof P>,
  message?: string,
) {
  return validateFormat<M, P>(field, { fmt: FORMATS.ipv4, message });
}

/**
 * Validates if value is ipv6.
 * @param field - Field to be validated.
 * @param message - Error message. Can be used to override default error message which is "is invalid".
 */
export function validateIpv6<M extends Model<M>, P extends Params<P>>(
  field: keyof P | Array<keyof P>,
  message?: string,
) {
  return validateFormat<M, P>(field, { fmt: FORMATS.ipv6, message });
}

/**
 * Validates if value is uuid.
 * @param field - Field to be validated.
 * @param message - Error message. Can be used to override default error message which is "is invalid".
 */
export function validateUuid<M extends Model<M>, P extends Params<P>>(
  field: keyof P | Array<keyof P>,
  message?: string,
): (source: Observable<Changeset<M, P>>) => Observable<Changeset<M, P>> {
  return validateFormat<M, P>(field, { fmt: FORMATS.uuid, message });
}

/**
 * Validates if value is date.
 * @param field - Field to be validated.
 * @param message - Error message. Can be used to override default error message which is "is invalid".
 */
export function validateDate<M extends Model<M>, P extends Params<P>>(
  field: keyof P | Array<keyof P>,
  message?: string,
) {
  return validateFormat<M, P>(field, { fmt: FORMATS.date, message });
}

/**
 * Validates if value is time.
 * @param field - Field to be validated.
 * @param message - Error message. Can be used to override default error message which is "is invalid".
 */
export function validateTime<M extends Model<M>, P extends Params<P>>(
  field: keyof P | Array<keyof P>,
  message?: string,
) {
  return validateFormat<M, P>(field, { fmt: FORMATS.time, message });
}

/**
 * Validates if value is date_time.
 * @param field - Field to be validated.
 * @param message - Error message. Can be used to override default error message which is "is invalid".
 */
export function validateDateTime<M extends Model<M>, P extends Params<P>>(
  field: keyof P | Array<keyof P>,
  message?: string,
) {
  return validateFormat<M, P>(field, { fmt: FORMATS.dateTime, message });
}

/**
 * Inclusion validator. Checks if value is included in configured list.
 * @param field - Field to be validated.
 * @param opts - Options. Can be used to override default error message.
 * @param opts.in - List of values to be checked against.
 * @param opts.message - Error message. Can be used to override default error message which is "is not included in the list".
 * @param opts.allowBlank - If true, allows empty value. Default is false.
 */
export function validateInclusion<M extends Model<M>, P extends Params<P>>(
  field: keyof P,
  opts: { in: Array<unknown>; message?: string },
) {
  return (source: Observable<Changeset<M, P>>): Observable<Changeset<M, P>> => {
    return source.pipe(
      map(({ params, data, errors, changes }) => {
        const validator = Validator.inclusion;
        const value = changes[field];

        if (!opts.in.includes(value)) {
          delete changes[field];
          const message = (opts?.message ?? "should be one of: ${in}").replace(
            "${in}",
            opts.in.join(", "),
          );
          errors[field] = [
            ...(errors[field] ?? []),
            { validator, message, in: opts.in },
          ];
        }
        return { params, data, errors, changes };
      }),
    );
  };
}

/**
 * Exclusion validator. Checks if value is not included in configured list.
 * @param field - Field to be validated.
 * @param opts - Options. Can be used to override default error message.
 * @param opts.notIn - List of values to be checked against.
 * @param opts.message - Error message. Can be used to override default error message which is
 *
 */
export function validateExclusion<M extends Model<M>, P extends Params<P>>(
  field: keyof P,
  opts: { notIn: Array<unknown>; message?: string },
) {
  return (source: Observable<Changeset<M, P>>): Observable<Changeset<M, P>> => {
    return source.pipe(
      map(({ params, data, errors, changes }) => {
        const validator = Validator.exclusion;
        const value = changes[field];

        if (opts.notIn.includes(value)) {
          delete changes[field];
          const message = (
            opts?.message ?? "should not be one of: ${notIn}"
          ).replace("${notIn}", opts.notIn.join(", "));
          errors[field] = [
            ...(errors[field] ?? []),
            { validator, message, notIn: opts.notIn },
          ];
        }
        return { params, data, errors, changes };
      }),
    );
  };
}

/**
 * Confirm validator. Checks if value is equal to confirmation value.
 * @param field - Field to be validated.
 * @param opts - Options. Can be used to override default error message.
 * @param opts.confirm - Name of the confirmation field. Default is `${field}Confirm`.
 * @param opts.message - Error message. Can be used to override default error message which is "doesn't match".
 *
 */
export function validateConfirm<M extends Model<M>, P extends Params<P>>(
  field: keyof P,
  opts?: { confirm?: keyof P; message?: string },
) {
  return (source: Observable<Changeset<M, P>>): Observable<Changeset<M, P>> => {
    return source.pipe(
      map(({ params, data, errors, changes }) => {
        const validator = Validator.confirm;
        const value = changes[field];
        const confirm = opts?.confirm ?? (`${String(field)}Confirm` as keyof P);

        if (value !== params[confirm]) {
          delete changes[field];
          const message = opts?.message ?? "doesn't match";
          errors[field] = [
            ...(errors[field] ?? []),
            { validator, message, confirm },
          ];
        }
        return { params, data, errors, changes };
      }),
    );
  };
}

/**
 * Acceptance validator. Checks if value is true.
 */
export function validateAcceptance<M extends Model<M>, P extends Params<P>>(
  field: keyof P,
  opts?: { message?: string; truthy?: Array<unknown> },
) {
  return (source: Observable<Changeset<M, P>>): Observable<Changeset<M, P>> => {
    return source.pipe(
      map(({ params, data, errors, changes }) => {
        const validator = Validator.acceptance;
        const value = changes[field];
        const truthy = opts?.truthy ?? [true, "true", 1, "1"];

        if (truthy.includes(value) === false) {
          delete changes[field];
          const message = opts?.message ?? "must be accepted";
          errors[field] = [
            ...(errors[field] ?? []),
            { validator, message, truthy },
          ];
        }
        return { params, data, errors, changes };
      }),
    );
  };
}
