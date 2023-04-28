/**
 * Pluralize a word based on a count
 * @param word - the word to pluralize
 * @param count - the count to use to determine if the word should be pluralized
 */
export function pluralize(word: string, count: number) {
  // exceptions come first
  const exceptions = {
    child: "children",
    person: "people",
    datum: "data",
  };
  if (count === 1) return word;
  if (exceptions[word]) return exceptions[word];
  return `${word}s`;
}
