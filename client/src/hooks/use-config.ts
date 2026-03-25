import { useQuery } from "@tanstack/react-query";

interface AppConfig {
  betaMode: boolean;
}

export function useConfig(): AppConfig {
  const { data } = useQuery<AppConfig>({
    queryKey: ["app-config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      if (!res.ok) return { betaMode: false };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  return data ?? { betaMode: false };
}
