export const EncodingType = {
  Base64: 'base64',
  UTF8: 'utf8',
};

export const readAsStringAsync = async (uri: string, options?: any) => {
  return 'AQIDBA==';
};

export const getInfoAsync = async (uri: string) => {
  return {
    exists: true,
    size: 1024,
    uri,
  };
};

export default {
  EncodingType,
  readAsStringAsync,
  getInfoAsync,
};

