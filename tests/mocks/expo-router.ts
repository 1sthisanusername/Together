export const useRouter = () => ({
  push: () => {},
  replace: () => {},
  back: () => {},
});

export const usePathname = () => '/';
export const useLocalSearchParams = () => ({});
export const Tabs = {
  Screen: 'Tabs.Screen',
};

export default {
  useRouter,
  usePathname,
  useLocalSearchParams,
  Tabs,
};

