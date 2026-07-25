import { useQuery } from "@tanstack/react-query";

export interface Country {
  countryId: string;
  countryCode: string;
  name: string;
  currency: string | null;
  timezone: string | null;
  locale: string | null;
  flagEmoji: string | null;
  isActive: boolean | null;
}

export function useCountries() {
  return useQuery<Country[]>({
    queryKey: ["/api/countries"],
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
