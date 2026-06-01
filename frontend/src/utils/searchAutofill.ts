export function isSearchTypingForward(previousValue: string, nextValue: string): boolean {
  return nextValue.length > previousValue.length;
}
