const mockStore = new Map<string, string>();

export const getItemAsync = async (key: string) => mockStore.get(key) ?? null;
export const setItemAsync = async (key: string, value: string) => {
  mockStore.set(key, value);
};
export const deleteItemAsync = async (key: string) => {
  mockStore.delete(key);
};

