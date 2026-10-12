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
  const [selectedCountryId, setSelectedCountryIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('selectedCountryId') || null;
  });

  const [currentOrganization, setCurrentOrganization] = useState<Council | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('currentOrganization');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
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
      // Auto-switch current organization to the first council in this country if not already in it
      const countryCouncils = allOrganizations.filter(o => o.countryId === countryId);
      if (countryCouncils.length > 0 && currentOrganization?.countryId !== countryId) {
        setCurrentOrganization(countryCouncils[0]);
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
          if (parsed && parsed.councilId) {
            const found = allOrganizations.find(o => o.councilId === parsed.councilId);
            setCurrentOrganization(found || allOrganizations[0]);
          } else {
            setCurrentOrganization(allOrganizations[0]);
          }
        } catch {
          setCurrentOrganization(allOrganizations[0]);
        }
      } else {
        setCurrentOrganization(allOrganizations[0]);
      }
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
