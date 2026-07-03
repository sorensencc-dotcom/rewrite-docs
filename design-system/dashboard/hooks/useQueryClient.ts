import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 2,
        staleTime: 5000,
        gcTime: 60000,
      },
    },
  });
}

export const queryClient = createQueryClient();
