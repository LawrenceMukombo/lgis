import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export interface Country {
  countryId: string;
  countryCode: string;
  name: string;
  currencyCode: string;
  currencySymbol: string;
  timezone: string;
  locale: string | null;
  dateFormat: string | null;
  flagEmoji: string | null;
  status: string;
  createdAt?: string;
  // Backward compatibility alias:
  isActive?: boolean;
}

export interface Council {
  councilId: string;
  countryId?: string | null;
  name: string;
  level: string;
  countryCode: string | null;
  currencyCode: string | null;
  timezone: string | null;
  status: string | null;
  logoUrl: string | null;
  themeColor: string | null;
  fontFamily: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  dateFormat: string | null;
  timeFormat: string | null;
  createdAt?: string;
}

export function useCountries() {
  return useQuery<Country[]>({
    queryKey: ["/api/countries"],
    staleTime: 5 * 60 * 1000,
  });
}

export function useCountryCouncils(countryId: string | null | undefined) {
  return useQuery<Council[]>({
    queryKey: ["/api/countries", countryId, "councils"],
    queryFn: async () => {
      if (!countryId) {
        const res = await apiRequest("GET", "/api/v1/councils");
        return res.json();
      }
      const res = await apiRequest("GET", `/api/countries/${countryId}/councils`);
      return res.json();
    },
    enabled: true,
  });
}

export function useCreateCountry() {
  return useMutation({
    mutationFn: async (data: Partial<Country>) => {
      const res = await apiRequest("POST", "/api/countries", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
    },
  });
}

export function useCreateCouncil() {
  return useMutation({
    mutationFn: async (data: { countryId: string; council: Partial<Council> }) => {
      const res = await apiRequest("POST", `/api/countries/${data.countryId}/councils`, data.council);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/countries", variables.countryId, "councils"] });
      queryClient.invalidateQueries({ queryKey: ["/api/councils"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/councils"] });
    },
  });
}

export function useOnboardCountryWithCouncils() {
  return useMutation({
    mutationFn: async (data: { country: Partial<Country>; councils: Partial<Council>[] }) => {
      const res = await apiRequest("POST", "/api/countries/onboard", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/councils"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/councils"] });
    },
  });
}
