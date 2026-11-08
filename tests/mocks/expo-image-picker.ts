export const MediaTypeOptions = {
  All: 'All',
  Images: 'Images',
  Videos: 'Videos',
};

export const requestMediaLibraryPermissionsAsync = async () => ({ status: 'granted' });
export const requestCameraPermissionsAsync = async () => ({ status: 'granted' });
export const launchImageLibraryAsync = async () => ({ canceled: true, assets: [] });
export const launchCameraAsync = async () => ({ canceled: true, assets: [] });

export default {
  MediaTypeOptions,
  requestMediaLibraryPermissionsAsync,
  requestCameraPermissionsAsync,
  launchImageLibraryAsync,
  launchCameraAsync,
};

