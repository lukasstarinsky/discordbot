export function Wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}