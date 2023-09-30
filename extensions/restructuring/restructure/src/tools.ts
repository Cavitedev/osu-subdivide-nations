export function isNumber(value: any) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}
