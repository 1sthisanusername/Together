export const GoogleSignin = {
  configure: () => {},
  hasPlayServices: async () => true,
  signIn: async () => ({
    data: { idToken: 'mock-google-id-token' },
    idToken: 'mock-google-id-token',
  }),
  signOut: async () => {},
};

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

