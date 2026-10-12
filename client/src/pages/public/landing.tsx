import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  ArrowRight, Building2, FileText, Search, Map, ShieldCheck, Globe,
  CheckCircle, ChevronDown, Sparkles, MapPin, Layers
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/organization-context";
import { useCountries } from "@/hooks/use-countries";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const {
    currentOrganization,
    setCurrentOrganization,
    organizations,
    allOrganizations,
    selectedCountryId,
    setSelectedCountryId,
  } = useOrganization();
  const { data: countries = [] } = useCountries();

  // Find active country record
  const activeCountry = React.useMemo(() => {
    return countries.find(c => c.countryId === selectedCountryId) ||
      countries.find(c => c.countryCode === 'ZM') ||
      countries[0];
  }, [countries, selectedCountryId]);

  const councilName = currentOrganization?.name || "Lusaka City Council";
  const countryName = activeCountry?.name || "Republic of Zambia";
  const flagEmoji = activeCountry?.flagEmoji || "🇿🇲";

  const handleServiceClick = (path: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: `Please sign in or register to access services for ${councilName}.`,
        variant: "destructive"
      });
      setLocation("/login");
      return;
    }
    setLocation(path);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Universal Country & Council Switcher Bar */}
      <div className="bg-[#0F0F0F] text-white px-4 py-2 border-b border-white/10 text-xs">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-gray-300 font-medium">Local Government Information System (LGIS)</span>
            <span className="text-gray-500 hidden sm:inline">•</span>
            <span className="text-yellow-400 font-semibold hidden sm:inline">Multi-Country & Multi-Council Digital Platform</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Country Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Country:</span>
              <Select
                value={selectedCountryId || activeCountry?.countryId || ""}
                onValueChange={(cid) => {
                  setSelectedCountryId(cid);
                  toast({
                    title: "Country Switched",
                    description: `Viewing councils for ${countries.find(c => c.countryId === cid)?.name || "country"}.`,
                  });
                }}
              >
                <SelectTrigger className="h-7 w-[160px] bg-white/10 border-white/20 text-white text-xs font-semibold">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-slate-700">
                  {countries.map(c => (
                    <SelectItem key={c.countryId} value={c.countryId} className="text-xs">
                      {c.flagEmoji || "🏳"} {c.name} ({c.countryCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Council Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Council:</span>
              <Select
                value={currentOrganization?.councilId || ""}
                onValueChange={(cid) => {
                  const target = allOrganizations.find(o => o.councilId === cid);
                  if (target) {
                    setCurrentOrganization(target);
                    toast({
                      title: "Council Selected",
                      description: `Switched portal context to ${target.name}.`,
                    });
                  }
                }}
              >
                <SelectTrigger className="h-7 w-[210px] bg-white/10 border-white/20 text-white text-xs font-semibold">
                  <SelectValue placeholder="Select Council" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-slate-900 text-white border-slate-700">
                  {organizations.map(org => (
                    <SelectItem key={org.councilId} value={org.councilId} className="text-xs">
                      🏛️ {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Zambian Flag Horizon Ribbon: Green field (50%), Red (16.6%), Black (16.6%), Copper Orange (16.6%) */}
      <div className="h-1.5 w-full flex">
        <div className="w-1/2 bg-[#198A00]" title="Natural Resources & Flora" />
        <div className="w-1/6 bg-[#DE2010]" title="Struggle for Freedom" />
        <div className="w-1/6 bg-[#000000]" title="The Zambian People" />
        <div className="w-1/6 bg-[#EF7D00]" title="Mineral Wealth & Copper" />
      </div>

      {/* Main Header */}
      <header className="border-b sticky top-0 bg-white/95 backdrop-blur z-50 shadow-xs">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0B0F17] border border-[#EF7D00]/40 flex items-center justify-center text-[#EF7D00] font-bold text-lg shadow-xs">
              <Building2 className="h-6 w-6 text-[#EF7D00]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-[#0B0F17] leading-tight">
                  {councilName}
                </h1>
                <Badge variant="outline" className="text-[10px] font-semibold border-[#EF7D00]/40 text-[#EF7D00] bg-orange-50">
                  {flagEmoji} {activeCountry?.countryCode || "ZM"}
                </Badge>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                {countryName} • Local Authority Digital Services
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/verify">
              <Button variant="ghost" size="sm" className="hidden sm:flex text-xs font-semibold hover:text-[#EF7D00]">
                <ShieldCheck className="h-3.5 w-3.5 mr-1 text-[#198A00]" />
                Verify License
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs font-semibold hover:text-[#EF7D00]">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-[#EF7D00] text-white hover:bg-[#D96800] text-xs font-bold shadow-xs">
                Register
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-[#0B0F17] text-white overflow-hidden py-20 md:py-28">
        {/* Modern Geometric Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F17] via-[#0F172A] to-[#1E293B]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#EF7D00_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 text-[#EF7D00] text-xs font-semibold mb-6 border border-[#EF7D00]/40">
              <span className="h-2 w-2 rounded-full bg-[#DE2010] animate-pulse" />
              <Building2 className="h-3.5 w-3.5 text-[#EF7D00]" />
              <span>{councilName} Online Citizen & Business Portal</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
              Access Council Services <span className="text-[#EF7D00]">Online & Anytime</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed">
              Register your business, apply for trading permits and fire safety certificates, pay rates, and manage municipal compliance obligations directly with the <strong className="text-white">{councilName}</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-[#EF7D00] text-white hover:bg-[#D96800] font-bold h-12 px-8 text-base shadow-lg shadow-orange-950/40 border border-orange-400/20">
                  Get Started Online
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/verify">
                <Button size="lg" variant="outline" className="border-slate-700 hover:bg-slate-900 text-white h-12 px-8 text-base">
                  <ShieldCheck className="mr-2 h-4 w-4 text-[#198A00]" />
                  Verify a License
                </Button>
              </Link>
            </div>

            {/* Quick stats / metadata */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10 text-xs text-gray-400">
              <div>
                <span className="block text-xl font-bold text-white">100%</span>
                Digital Applications
              </div>
              <div>
                <span className="block text-xl font-bold text-white">Instant</span>
                QR Verification
              </div>
              <div>
                <span className="block text-xl font-bold text-white">115</span>
                Zambian Councils Onboarded
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Online Services</h2>
            <p className="text-gray-500 text-base">
              Digitized municipal processes saving citizens and businesses time across {countryName}.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              icon={<Building2 className="h-8 w-8 text-[#EF7D00]" />}
              title="Business Registration"
              description={`Register commercial entities, trading stores, and enterprises operating within the jurisdiction of ${councilName}.`}
              onClick={() => handleServiceClick("/portal/register-business")}
            />
            <ServiceCard
              icon={<FileText className="h-8 w-8 text-[#EF7D00]" />}
              title="Licensing & Permits"
              description="Apply for new trade licenses, liquor permits, fire certificates, and renew operational approvals online."
              onClick={() => handleServiceClick("/licensing")}
            />
            <ServiceCard
              icon={<Map className="h-8 w-8 text-[#EF7D00]" />}
              title="Regulatory Compliance"
              description="Review municipal inspection notices, view spatial GIS zone allocations, and settle council levies securely."
              onClick={() => handleServiceClick("/inspections")}
            />
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl font-bold text-gray-900">Simple 3-Step Process</h2>

              <Step
                number="1"
                title="Create an Account"
                description="Sign up with your national ID / NRC and email to create a verified applicant profile."
              />
              <Step
                number="2"
                title="Select Your Council"
                description={`Choose ${councilName} or any of the local authorities across Zambia's 10 provinces.`}
              />
              <Step
                number="3"
                title="Apply & Download License"
                description="Submit paperwork, pay statutory fees online, and download verifiable digital certificates with QR validation."
              />
            </div>

            <div className="flex-1 bg-orange-50/60 rounded-3xl p-8 md:p-12 border border-orange-100">
              <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#DE2010]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#000000]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#EF7D00]"></div>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    portal.gov.zm/council/{councilName.toLowerCase().replace(/[^a-z0-9]/g, "-")}
                  </div>
                </div>
                <div className="p-8 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-200/50">
                      <Building2 className="h-6 w-6 text-[#EF7D00]" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900">{councilName}</div>
                      <div className="text-xs text-[#198A00] font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified Local Authority Portal
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-9 bg-gray-50 rounded border border-gray-100 px-3 flex items-center text-xs text-gray-500">
                      🏢 Business Trading License Application
                    </div>
                    <div className="h-9 bg-gray-50 rounded border border-gray-100 px-3 flex items-center text-xs text-gray-500">
                      📍 Ward Planning & Zonal Inspection
                    </div>
                  </div>
                  <div className="h-10 bg-[#0B0F17] text-white hover:bg-black rounded font-bold text-xs flex items-center justify-center border-t-2 border-[#EF7D00]">
                    Pay Council Rates & Download License
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B0F17] text-gray-400 py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-500/20 text-[#EF7D00] flex items-center justify-center font-bold">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">
                  {councilName}
                </span>
                <span className="text-xs text-gray-400">
                  {countryName} Local Government Information System (LGIS)
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center md:text-right">
              &copy; {new Date().getFullYear()} {councilName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick?: () => void }) {
  return (
    <Card
      className="border border-gray-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 bg-white hover:border-[#EF7D00]/50"
      onClick={onClick}
    >
      <CardHeader>
        <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 border border-orange-200/40">
          {icon}
        </div>
        <CardTitle className="text-xl text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-gray-500 leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

function Step({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#0B0F17] text-[#EF7D00] font-bold flex items-center justify-center border-2 border-[#EF7D00]">
        {number}
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
