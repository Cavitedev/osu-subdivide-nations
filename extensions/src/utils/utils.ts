




// Utils

export const convertToGroupsOf5 = (number: number) => {
  const groupSize = 5;
  const start = (number - 1) * groupSize + 1;

  return Array.from({ length: groupSize }, (_, index) => start + index);
};

export const addOrReplaceQueryParam = (url:string, paramName:string, paramValue:string) => {
  try {
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);

    // Add or replace the parameter
    searchParams.set(paramName, paramValue);

    // Update the URL with the modified parameters
    urlObj.search = searchParams.toString();

    return urlObj.toString();
  } catch (e) {
    // Invalid URL
    return url;
  }
};

export const removeQueryParam = (url:string, paramName:string) => {
  try {
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);

    // Add or replace the parameter
    searchParams.delete(paramName);

    // Update the URL with the modified parameters
    urlObj.search = searchParams.toString();

    return urlObj.toString();
  } catch (e) {
    // Invalid URL
    return url;
  }
};

export function isNumber(value: any) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}
