export const createURL = (path: string) => `together://${path}`;
export const parse = (url: string) => ({ path: url, queryParams: {} });
export default {
  createURL,
  parse,
};

