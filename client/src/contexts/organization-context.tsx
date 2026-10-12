import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface Council {
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
}

interface OrganizationContextType {
  currentOrganization: Council | null;
  setCurrentOrganization: (org: Council) => void;
  organizations: Council[];
  allOrganizations: Council[];
  isLoading: boolean;
  selectedCountryId: string | null;
  setSelectedCountryId: (countryId: string | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  // Default to Zambia (7aa66363-752b-4b39-9b79-d413c8504e83) if not explicitly stored
  const [selectedCountryId, setSelectedCountryIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return '7aa66363-752b-4b39-9b79-d413c8504e83';
    return localStorage.getItem('selectedCountryId') || '7aa66363-752b-4b39-9b79-d413c8504e83';
  });

  const [currentOrganization, setCurrentOrganization] = useState<Council | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('currentOrganization');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      // If legacy NCDC is stored but user is onboarding Zambia, allow fresh pick
      if (parsed?.name?.includes("National Capital District")) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const { data, isLoading } = useQuery<Council[]>({
    queryKey: ["/api/councils"],
  });

  const allOrganizations: Council[] = data || [];

  const organizations = React.useMemo(() => {
    if (!selectedCountryId) return allOrganizations;
    return allOrganizations.filter(o => o.countryId === selectedCountryId);
  }, [allOrganizations, selectedCountryId]);

  const setSelectedCountryId = (countryId: string | null) => {
    setSelectedCountryIdState(countryId);
    if (countryId) {
      localStorage.setItem('selectedCountryId', countryId);
      // Auto-switch current organization to the first/primary council in this country
      const countryCouncils = allOrganizations.filter(o => o.countryId === countryId);
      if (countryCouncils.length > 0 && currentOrganization?.countryId !== countryId) {
        const primaryCouncil = countryCouncils.find(c => c.name.includes("Lusaka") || c.name.includes("City")) || countryCouncils[0];
        setCurrentOrganization(primaryCouncil);
      }
    } else {
      localStorage.removeItem('selectedCountryId');
    }
  };

  useEffect(() => {
    if (allOrganizations.length > 0 && !currentOrganization) {
      const stored = localStorage.getItem('currentOrganization');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.councilId && !parsed.name?.includes("National Capital District")) {
            const found = allOrganizations.find(o => o.councilId === parsed.councilId);
            if (found) {
              setCurrentOrganization(found);
              return;
            }
          }
        } catch {
          // fallback
        }
      }

      // Default prioritize Lusaka City Council or first Zambian council
      const defaultOrg = allOrganizations.find(o => o.name === 'Lusaka City Council')
        || allOrganizations.find(o => o.countryCode === 'ZM')
        || allOrganizations[0];
      setCurrentOrganization(defaultOrg);
    }
  }, [allOrganizations, currentOrganization]);

  // Persist currentOrganization to localStorage
  useEffect(() => {
    if (currentOrganization) {
      localStorage.setItem('currentOrganization', JSON.stringify(currentOrganization));
      if (currentOrganization.countryId && currentOrganization.countryId !== selectedCountryId) {
        setSelectedCountryIdState(currentOrganization.countryId);
        localStorage.setItem('selectedCountryId', currentOrganization.countryId);
      }
    }
  }, [currentOrganization]);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        setCurrentOrganization,
        organizations,
        allOrganizations,
        isLoading,
        selectedCountryId,
        setSelectedCountryId,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
}
