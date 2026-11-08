export const SaveFormat = {
  JPEG: 'jpeg',
  PNG: 'png',
  WEBP: 'webp',
};

export const manipulateAsync = async (uri: string, actions?: any[], saveOptions?: any) => {
  return {
    uri,
    width: 1600,
    height: 1200,
  };
};

export default {
  SaveFormat,
  manipulateAsync,
};

