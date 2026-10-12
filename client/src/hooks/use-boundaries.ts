import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface BoundaryItem {
  boundary_id: string;
  country_id: string | null;
  country_code: string;
  level: number;
  level_type: "country" | "province" | "district" | "ward";
  name: string;
  code: string | null;
  parent_code: string | null;
  parent_name: string | null;
  council_id: string | null;
  council_name?: string | null;
  source: string;
  source_url?: string | null;
  geometry_type: string;
  coordinates?: any;
  centroid?: { lat: number; lng: number } | null;
  bounding_box?: [number, number, number, number] | null;
  area_km2?: string | number | null;
  properties?: Record<string, any>;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BoundariesListResponse {
  boundaries: BoundaryItem[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface BoundaryFilters {
  countryId?: string | null;
  countryCode?: string | null;
  level?: number | string;
  levelType?: string;
  councilId?: string | null;
  parentName?: string;
  source?: string;
  search?: string;
  includeGeometry?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export function useBoundaries(filters: BoundaryFilters = {}) {
  const queryParams = new URLSearchParams();

  if (filters.countryId) queryParams.set("countryId", filters.countryId);
  if (filters.countryCode) queryParams.set("countryCode", filters.countryCode);
  if (filters.level !== undefined && filters.level !== "") queryParams.set("level", String(filters.level));
  if (filters.levelType) queryParams.set("levelType", filters.levelType);
  if (filters.councilId) queryParams.set("councilId", filters.councilId);
  if (filters.parentName) queryParams.set("parentName", filters.parentName);
  if (filters.source) queryParams.set("source", filters.source);
  if (filters.search) queryParams.set("search", filters.search);
  if (filters.includeGeometry) queryParams.set("includeGeometry", "true");
  if (filters.page) queryParams.set("page", String(filters.page));
  if (filters.limit) queryParams.set("limit", String(filters.limit));
  if (filters.sortBy) queryParams.set("sortBy", filters.sortBy);
  if (filters.sortDir) queryParams.set("sortDir", filters.sortDir);

  const url = `/api/boundaries?${queryParams.toString()}`;

  return useQuery<BoundariesListResponse>({
    queryKey: ["/api/boundaries", filters],
    queryFn: async () => {
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });
}

export function useBoundary(boundaryId?: string | null) {
  return useQuery<BoundaryItem>({
    queryKey: ["/api/boundaries", boundaryId],
    queryFn: async () => {
      if (!boundaryId) throw new Error("No boundary ID provided");
      const res = await apiRequest("GET", `/api/boundaries/${boundaryId}`);
      return res.json();
    },
    enabled: !!boundaryId,
  });
}

export function useUploadBoundaries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      countryId?: string | null;
      countryCode?: string;
      councilId?: string | null;
      level?: number;
      levelType?: string;
      parentName?: string;
      geojson: any;
    }) => {
      const res = await apiRequest("POST", "/api/boundaries/upload", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boundaries"] });
    },
  });
}

export function useImportBoundariesFromUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      url: string;
      countryId?: string | null;
      countryCode?: string;
      councilId?: string | null;
      level?: number;
      levelType?: string;
      parentName?: string;
    }) => {
      const res = await apiRequest("POST", "/api/boundaries/import-url", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boundaries"] });
    },
  });
}

export function useSyncGadm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { countryCode?: string; countryId?: string | null }) => {
      const res = await apiRequest("POST", "/api/boundaries/sync-gadm", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boundaries"] });
    },
  });
}
