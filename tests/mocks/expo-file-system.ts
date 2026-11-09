export const EncodingType = {
  Base64: 'base64',
  UTF8: 'utf8',
};

export const documentDirectory = 'file:///test-documents/';

export const readAsStringAsync = async (uri: string, options?: any) => {
  return 'AQIDBA==';
};

export const writeAsStringAsync = async (uri: string, contents: string) => {
  return;
};

export const deleteAsync = async (uri: string, options?: any) => {
  return;
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
  documentDirectory,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  getInfoAsync,
};
