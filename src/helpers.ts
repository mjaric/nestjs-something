import { pluralMap, singularMap } from "./irregular-plurals";

/**
 * Takes a word and number and decides if word should be pluralized
 */
export function pluralize(word: string, count: number) {
  // if count is 1, and word is not already pluralized, return word

  return count === 1 ? word : asPlural(word);
}

/**
 * asPlural a word
 * @param word - word to pluralize
 */
export function asPlural(word: string) {
  const maybeIrregular = singularMap.get(word);
  if (maybeIrregular) return maybeIrregular;
  if (word.endsWith("y")) return `${word.slice(0, -1)}ies`;
  if (word.endsWith("s")) return `${word}es`;
  return `${word}s`;
}

/**
 * asSingular a word based on a count
 * @param word - word to singularize
 */
export function asSingular(word: string) {
  const maybeIrregular = pluralMap.get(word);
  if (maybeIrregular) return maybeIrregular;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.endsWith("es")) return word.slice(0, -2);
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

/**
 * Convert a string to camelcase
 * @example
 * ```ts
 * toCamelCase("Hello World") // helloWorld
 * toCamelCase("helloWorld") // helloWorld
 * toCamelCase("hello_world") // helloWorld
 * toCamelCase("hello-world") // helloWorld
 * toCamelCase("hello world") // helloWorld
 * toCamelCase("HelloWorld") // helloWorld
 * ```
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
}

/**
 * Convert a string to snakecase
 * @example
 * ```ts
 * toSnakeCase("Hello World") // hello_world
 * toSnakeCase("helloWorld") // hello_world
 * toSnakeCase("hello-world") // hello_world
 * toSnakeCase("hello_world") // hello_world
 * toSnakeCase("hello world") // hello_world
 * toSnakeCase("helloWorld") // hello_world
 * toSnakeCase("HelloWorld") // hello_world
 * ```
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : "_" + word.toLowerCase();
    })
    .replace(/\s+/g, "");
}

/**
 * Convert a string to kebabcase
 * @example
 * ```ts
 * toKebabCase("Hello World") // hello-world
 * toKebabCase("helloWorld") // hello-world
 * toKebabCase("hello_world") // hello-world
 * toKebabCase("hello-world") // hello-world
 * toKebabCase("hello world") // hello-world
 * toKebabCase("HelloWorld") // hello-world
 * ```
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : "-" + word.toLowerCase();
    })
    .replace(/\s+/g, "");
}

/**
 * Convert a string to pascalcase
 * @example
 * toPascalCase("hello world") // HelloWorld
 * toPascalCase("hello-world") // HelloWorld
 * toPascalCase("hello_world") // HelloWorld
 * toPascalCase("helloWorld") // HelloWorld
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
      return word.toUpperCase();
    })
    .replace(/\s+/g, "");
}

/**
 * Check if two values are the same type
 * @param a
 * @param b
 */
export function isSameType<T, U>(a: T, b: U): a is T & U {
  return typeof a === typeof b;
}
