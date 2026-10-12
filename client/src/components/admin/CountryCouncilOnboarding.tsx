import { useState, useMemo } from "react";
import {
  Globe,
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  ArrowUpDown,
  Download,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Clock,
  Coins,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import {
  useCountries,
  useCreateCountry,
  useCreateCouncil,
  useOnboardCountryWithCouncils,
  type Country,
  type Council
} from "@/hooks/use-countries";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useOrganization } from "@/contexts/organization-context";

export function CountryCouncilOnboarding() {
  const { data: countries = [], isLoading: isLoadingCountries, refetch: refetchCountries } = useCountries();
  const { currentOrganization, setCurrentOrganization } = useOrganization();

  // All Councils Query
  const { data: councils = [], isLoading: isLoadingCouncils, refetch: refetchCouncils } = useQuery<Council[]>({
    queryKey: ["/api/v1/councils"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/v1/councils");
      return res.json();
    }
  });

  // State filters
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("all");

  // Sorting
  const [sortField, setSortField] = useState<keyof Council>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination (Rule 24 Enterprise-Grade)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    level: true,
    country: true,
    currency: true,
    timezone: true,
    contact: true,
    status: true,
    actions: true,
  });

  // Dialogs
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isCouncilModalOpen, setIsCouncilModalOpen] = useState(false);
  const [isOnboardWizardOpen, setIsOnboardWizardOpen] = useState(false);

  // Form states
  const [newCountry, setNewCountry] = useState({
    name: "",
    countryCode: "",
    currencyCode: "",
    currencySymbol: "",
    timezone: "Africa/Lusaka",
    locale: "en-ZM",
    flagEmoji: "🇿🇲",
  });

  const [newCouncil, setNewCouncil] = useState({
    countryId: "",
    name: "",
    level: "city",
    address: "",
    phone: "",
    email: "",
    website: "",
  });

  // Mutations
  const createCountryMutation = useCreateCountry();
  const createCouncilMutation = useCreateCouncil();
  const onboardBulkMutation = useOnboardCountryWithCouncils();

  // Filtered & Sorted Councils
  const filteredCouncils = useMemo(() => {
    return councils.filter((c) => {
      const matchesCountry =
        selectedCountryFilter === "all" ||
        c.countryId === selectedCountryFilter ||
        c.countryCode?.toLowerCase() === selectedCountryFilter.toLowerCase();

      const matchesLevel =
        selectedLevelFilter === "all" ||
        c.level?.toLowerCase() === selectedLevelFilter.toLowerCase();

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.countryCode && c.countryCode.toLowerCase().includes(q));

      return matchesCountry && matchesLevel && matchesSearch;
    }).sort((a, b) => {
      const valA = (a[sortField] || "").toString().toLowerCase();
      const valB = (b[sortField] || "").toString().toLowerCase();
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [councils, selectedCountryFilter, selectedLevelFilter, searchQuery, sortField, sortDirection]);

  // Pagination slicing
  const totalRecords = filteredCouncils.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedCouncils = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCouncils.slice(start, start + pageSize);
  }, [filteredCouncils, currentPage, pageSize]);

  const handleSort = (field: keyof Council) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handlers
  const handleCreateCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountry.name || !newCountry.countryCode || !newCountry.currencyCode) {
      toast({ title: "Validation Error", description: "Name, Country Code, and Currency are required.", variant: "destructive" });
      return;
    }

    try {
      await createCountryMutation.mutateAsync({
        name: newCountry.name,
        countryCode: newCountry.countryCode.toUpperCase(),
        currencyCode: newCountry.currencyCode.toUpperCase(),
        currencySymbol: newCountry.currencySymbol || "$",
        timezone: newCountry.timezone,
        locale: newCountry.locale,
        flagEmoji: newCountry.flagEmoji,
        status: "active",
      });

      toast({ title: "Country Created", description: `Successfully onboarded ${newCountry.name}.` });
      setIsCountryModalOpen(false);
      setNewCountry({
        name: "",
        countryCode: "",
        currencyCode: "",
        currencySymbol: "",
        timezone: "Africa/Lusaka",
        locale: "en-ZM",
        flagEmoji: "🇿🇲",
      });
      refetchCountries();
    } catch (err: any) {
      toast({ title: "Failed to create country", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateCouncil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouncil.countryId || !newCouncil.name) {
      toast({ title: "Validation Error", description: "Country and Council Name are required.", variant: "destructive" });
      return;
    }

    try {
      await createCouncilMutation.mutateAsync({
        countryId: newCouncil.countryId,
        council: {
          name: newCouncil.name,
          level: newCouncil.level,
          address: newCouncil.address,
          phone: newCouncil.phone,
          email: newCouncil.email,
          website: newCouncil.website,
          status: "active",
        }
      });

      toast({ title: "Council Onboarded", description: `Successfully onboarded ${newCouncil.name}.` });
      setIsCouncilModalOpen(false);
      setNewCouncil({
        countryId: "",
        name: "",
        level: "city",
        address: "",
        phone: "",
        email: "",
        website: "",
      });
      refetchCouncils();
    } catch (err: any) {
      toast({ title: "Failed to onboard council", description: err.message, variant: "destructive" });
    }
  };

  // Quick Preset for Zambia
  const handleQuickOnboardZambia = async () => {
    try {
      await onboardBulkMutation.mutateAsync({
        country: {
          name: "Zambia",
          countryCode: "ZM",
          currencyCode: "ZMW",
          currencySymbol: "K",
          timezone: "Africa/Lusaka",
          locale: "en-ZM",
          flagEmoji: "🇿🇲",
        },
        councils: [
          { name: "Lusaka City Council", level: "city", address: "City Hall, Independence Avenue, Lusaka", phone: "+260 211 220 400", email: "info@lcc.gov.zm", website: "https://www.lcc.gov.zm" },
          { name: "Kitwe City Council", level: "city", address: "Civic Centre, Obote Avenue, Kitwe", phone: "+260 212 226 000", email: "info@kcc.gov.zm", website: "https://www.kcc.gov.zm" },
          { name: "Ndola City Council", level: "city", address: "City Hall, Broadway, Ndola", phone: "+260 212 612 345", email: "info@ncc.gov.zm", website: "https://www.ncc.gov.zm" },
          { name: "Livingstone City Council", level: "city", address: "Civic Centre, Akapelwa Street, Livingstone", phone: "+260 213 321 000", email: "info@livingstonecouncil.gov.zm", website: "https://www.livingstonecouncil.gov.zm" },
          { name: "Chipata City Council", level: "city", address: "Civic Centre, Umodzi Highway, Chipata", phone: "+260 216 221 500", email: "info@chipatacouncil.gov.zm", website: "https://www.chipatacouncil.gov.zm" },
        ]
      });
      toast({ title: "Zambia Onboarding Complete", description: "Zambia and its major councils are verified and ready." });
      refetchCountries();
      refetchCouncils();
    } catch (err: any) {
      toast({ title: "Onboarding Error", description: err.message, variant: "destructive" });
    }
  };

  // CSV Export (Rule 24 Enterprise-Grade)
  const handleExportCSV = () => {
    const headers = ["Council ID", "Name", "Level", "Country Code", "Currency", "Timezone", "Status", "Email", "Phone", "Address"];
    const rows = filteredCouncils.map(c => [
      c.councilId,
      `"${c.name.replace(/"/g, '""')}"`,
      c.level,
      c.countryCode || "",
      c.currencyCode || "",
      c.timezone || "",
      c.status || "active",
      c.email || "",
      c.phone || "",
      `"${(c.address || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lgis-councils-${selectedCountryFilter}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards / Tenant Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-outline-dimmer bg-background-default shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Countries (Tenants)</CardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{countries.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              {countries.map(c => c.flagEmoji || "🌐").join(" ")} Multi-Country Active
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-outline-dimmer bg-background-default shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Councils</CardTitle>
            <Building2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{councils.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Local Authorities Onboarded</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-outline-dimmer bg-background-default shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Zambia Councils</CardTitle>
            <span className="text-lg">🇿🇲</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">
              {councils.filter(c => c.countryCode === "ZM" || c.currencyCode === "ZMW").length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Lusaka, Kitwe, Ndola & Provincial</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-outline-dimmer bg-background-default shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Context</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold truncate">{currentOrganization?.name || "None Selected"}</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              {currentOrganization?.countryCode === 'ZM' ? '🇿🇲 Zambia' : currentOrganization?.countryCode === 'PG' ? '🇵🇬 PNG' : currentOrganization?.countryCode || 'Multi-Tenant'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Country Tenant Grid Cards */}
      <Card className="border-2 border-outline-dimmer bg-background-default">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Onboarded Sovereign Tenants (Countries)
            </CardTitle>
            <CardDescription className="text-xs">
              Each country isolates localization, legal currency, date formats, and municipal hierarchies.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickOnboardZambia}
              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 font-bold text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
              Re-Verify Zambia 🇿🇲
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCountryModalOpen(true)}
              className="bg-[#0F0F0F] text-[#F4C400] hover:bg-black font-bold text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Onboard Country
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.map((country) => {
              const countryCouncils = councils.filter(c => c.countryId === country.countryId || c.countryCode === country.countryCode);
              return (
                <div
                  key={country.countryId}
                  className="p-4 rounded-xl border-2 border-outline-dimmer bg-background-higher hover:border-primary/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl leading-none">{country.flagEmoji || "🌐"}</span>
                        <div>
                          <h4 className="font-bold text-base leading-tight">{country.name}</h4>
                          <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                            ISO: {country.countryCode}
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                        {country.status || "active"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-background-default p-2.5 rounded-lg border border-outline-dimmer">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Currency:</span>
                        <span className="font-bold flex items-center gap-1">
                          <Coins className="h-3 w-3 text-amber-500" />
                          {country.currencyCode} ({country.currencySymbol || "$"})
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Timezone:</span>
                        <span className="font-bold truncate block">{country.timezone || "UTC"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-dimmer flex items-center justify-between text-xs">
                    <span className="font-bold text-primary flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {countryCouncils.length} Councils
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCountryFilter(country.countryId);
                        toast({ title: `Filtered to ${country.name}`, description: `Showing ${countryCouncils.length} councils.` });
                      }}
                      className="h-7 text-xs font-bold hover:bg-primary/10"
                    >
                      Filter View <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enterprise-Grade Councils Table (Rule 24 Compliant) */}
      <Card className="border-2 border-outline-dimmer bg-background-default shadow-sm">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-500" />
              Councils & Local Government Authorities
            </CardTitle>
            <CardDescription className="text-xs">
              Manage city, municipal, and district local government entities across countries.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="border-outline-dimmer hover:bg-background-higher text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCouncilModalOpen(true)}
              className="bg-[#0F0F0F] text-[#F4C400] hover:bg-black font-bold text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Onboard Council
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Controls: Search, Country Filter, Level Filter, Column Visibility */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-1 flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search councils, emails, cities..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-9 text-xs border-outline-dimmer bg-background-higher"
                />
              </div>

              {/* Country Selector Filter */}
              <Select
                value={selectedCountryFilter}
                onValueChange={(val) => {
                  setSelectedCountryFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48 h-9 text-xs border-outline-dimmer bg-background-higher">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌐 All Countries</SelectItem>
                  {countries.map(c => (
                    <SelectItem key={c.countryId} value={c.countryId}>
                      {c.flagEmoji || "🏳"} {c.name} ({c.countryCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Level Filter */}
              <Select
                value={selectedLevelFilter}
                onValueChange={(val) => {
                  setSelectedLevelFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-36 h-9 text-xs border-outline-dimmer bg-background-higher">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="city">City Council</SelectItem>
                  <SelectItem value="municipal">Municipal</SelectItem>
                  <SelectItem value="district">District</SelectItem>
                  <SelectItem value="llg">LLG</SelectItem>
                </SelectContent>
              </Select>

              {(selectedCountryFilter !== "all" || selectedLevelFilter !== "all" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCountryFilter("all");
                    setSelectedLevelFilter("all");
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              )}
            </div>

            {/* Column Visibility Selector (Rule 24) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs border-outline-dimmer">
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.level}
                  onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, level: checked }))}
                >
                  Council Level
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.country}
                  onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, country: checked }))}
                >
                  Country / Currency
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.timezone}
                  onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, timezone: checked }))}
                >
                  Timezone
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.contact}
                  onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, contact: checked }))}
                >
                  Contact & Address
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table Container */}
          <div className="rounded-lg border-2 border-outline-dimmer overflow-hidden bg-background-default">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-outline-dimmer bg-background-higher text-muted-foreground font-bold">
                    <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1.5">
                        Council Name
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    {visibleColumns.level && (
                      <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("level")}>
                        <div className="flex items-center gap-1.5">
                          Level
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                    )}
                    {visibleColumns.country && (
                      <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("countryCode")}>
                        <div className="flex items-center gap-1.5">
                          Country & Currency
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                    )}
                    {visibleColumns.timezone && (
                      <th className="p-3">Timezone</th>
                    )}
                    {visibleColumns.contact && (
                      <th className="p-3">Contact Details</th>
                    )}
                    {visibleColumns.status && (
                      <th className="p-3">Status</th>
                    )}
                    {visibleColumns.actions && (
                      <th className="p-3 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-dimmer">
                  {isLoadingCouncils ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                        Loading councils...
                      </td>
                    </tr>
                  ) : paginatedCouncils.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center">
                        <Building2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="font-semibold text-sm">No councils found</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Try adjusting your country or level filter.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedCouncils.map((council) => {
                      const isCurrent = currentOrganization?.councilId === council.councilId;
                      const isZambia = council.countryCode === "ZM" || council.currencyCode === "ZMW";

                      return (
                        <tr
                          key={council.councilId}
                          className={`hover:bg-background-higher transition-colors ${isCurrent ? 'bg-amber-500/5' : ''}`}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-md bg-amber-500/10 text-amber-700 font-bold flex items-center justify-center shrink-0 text-xs">
                                {isZambia ? "🇿🇲" : "🇵🇬"}
                              </div>
                              <div>
                                <span className="font-bold text-foreground text-xs block">{council.name}</span>
                                <span className="text-[10px] text-muted-foreground block truncate max-w-[200px]">
                                  {council.address || "Local Government Centre"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {visibleColumns.level && (
                            <td className="p-3">
                              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                                {council.level}
                              </Badge>
                            </td>
                          )}

                          {visibleColumns.country && (
                            <td className="p-3">
                              <div className="font-medium">
                                <span className="font-bold mr-1">{council.countryCode || "PG"}</span>
                                <span className="text-muted-foreground text-[11px]">({council.currencyCode || "PGK"})</span>
                              </div>
                            </td>
                          )}

                          {visibleColumns.timezone && (
                            <td className="p-3 text-muted-foreground text-[11px]">
                              {council.timezone || "UTC"}
                            </td>
                          )}

                          {visibleColumns.contact && (
                            <td className="p-3">
                              <div className="text-[11px]">
                                {council.email && <div className="truncate max-w-[180px]">{council.email}</div>}
                                {council.phone && <div className="text-muted-foreground">{council.phone}</div>}
                              </div>
                            </td>
                          )}

                          {visibleColumns.status && (
                            <td className="p-3">
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                                {council.status || "active"}
                              </Badge>
                            </td>
                          )}

                          {visibleColumns.actions && (
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isCurrent ? (
                                  <Badge className="bg-amber-500 text-black text-[10px] font-black">
                                    CURRENT ACTIVE
                                  </Badge>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setCurrentOrganization(council);
                                      toast({
                                        title: "Context Switched",
                                        description: `Active council changed to ${council.name}.`
                                      });
                                    }}
                                    className="h-7 text-[11px] font-bold border-outline-dimmer hover:bg-primary hover:text-primary-foreground"
                                  >
                                    Switch Context
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer (Rule 24 Enterprise-Grade) */}
            <div className="p-3 border-t-2 border-outline-dimmer bg-background-higher flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>
                  Showing <strong>{totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong> of <strong>{totalRecords}</strong> councils
                </span>
                <span className="text-outline-dimmer">|</span>
                <div className="flex items-center gap-1.5">
                  <span>Rows:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(val) => {
                      setPageSize(Number(val));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-7 w-16 text-xs bg-background-default border-outline-dimmer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="h-7 text-xs border-outline-dimmer"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                </Button>
                <span className="font-bold">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="h-7 text-xs border-outline-dimmer"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Onboard Country */}
      <Dialog open={isCountryModalOpen} onOpenChange={setIsCountryModalOpen}>
        <DialogContent className="max-w-md bg-background-default border-2 border-outline-dimmer">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Globe className="h-5 w-5 text-primary" />
              Onboard Sovereign Country (Tenant)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Establish a new national jurisdiction with localized currency and time policies.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCountry} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Country Name</Label>
              <Input
                placeholder="e.g. Zambia, Kenya, Ghana"
                value={newCountry.name}
                onChange={e => setNewCountry(prev => ({ ...prev, name: e.target.value }))}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">ISO 2-Letter Code</Label>
                <Input
                  placeholder="e.g. ZM"
                  maxLength={2}
                  value={newCountry.countryCode}
                  onChange={e => setNewCountry(prev => ({ ...prev, countryCode: e.target.value.toUpperCase() }))}
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Flag Emoji</Label>
                <Input
                  placeholder="e.g. 🇿🇲"
                  value={newCountry.flagEmoji}
                  onChange={e => setNewCountry(prev => ({ ...prev, flagEmoji: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Currency Code</Label>
                <Input
                  placeholder="e.g. ZMW, PGK, USD"
                  maxLength={3}
                  value={newCountry.currencyCode}
                  onChange={e => setNewCountry(prev => ({ ...prev, currencyCode: e.target.value.toUpperCase() }))}
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Currency Symbol</Label>
                <Input
                  placeholder="e.g. K, $, €"
                  value={newCountry.currencySymbol}
                  onChange={e => setNewCountry(prev => ({ ...prev, currencySymbol: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">National Timezone</Label>
              <Input
                placeholder="e.g. Africa/Lusaka, Pacific/Port_Moresby"
                value={newCountry.timezone}
                onChange={e => setNewCountry(prev => ({ ...prev, timezone: e.target.value }))}
                className="h-9 text-xs"
                required
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCountryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#0F0F0F] text-[#F4C400] hover:bg-black font-bold">
                Create Country
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Onboard Council */}
      <Dialog open={isCouncilModalOpen} onOpenChange={setIsCouncilModalOpen}>
        <DialogContent className="max-w-lg bg-background-default border-2 border-outline-dimmer">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Building2 className="h-5 w-5 text-amber-500" />
              Onboard Local Government Council
            </DialogTitle>
            <DialogDescription className="text-xs">
              Register a city, municipal, or district authority under a sovereign country.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCouncil} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Country Tenant</Label>
              <Select
                value={newCouncil.countryId}
                onValueChange={(val) => setNewCouncil(prev => ({ ...prev, countryId: val }))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select country tenant" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(c => (
                    <SelectItem key={c.countryId} value={c.countryId}>
                      {c.flagEmoji || "🌐"} {c.name} ({c.countryCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Council Name</Label>
              <Input
                placeholder="e.g. Lusaka City Council, Ndola City Council"
                value={newCouncil.name}
                onChange={e => setNewCouncil(prev => ({ ...prev, name: e.target.value }))}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Administrative Level</Label>
                <Select
                  value={newCouncil.level}
                  onValueChange={(val) => setNewCouncil(prev => ({ ...prev, level: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="city">City Council</SelectItem>
                    <SelectItem value="municipal">Municipal Council</SelectItem>
                    <SelectItem value="district">District Council</SelectItem>
                    <SelectItem value="llg">LLG (Local Level Government)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Official Email</Label>
                <Input
                  type="email"
                  placeholder="e.g. info@lcc.gov.zm"
                  value={newCouncil.email}
                  onChange={e => setNewCouncil(prev => ({ ...prev, email: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Official Phone</Label>
                <Input
                  placeholder="e.g. +260 211 220 400"
                  value={newCouncil.phone}
                  onChange={e => setNewCouncil(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Official Website</Label>
                <Input
                  placeholder="e.g. https://www.lcc.gov.zm"
                  value={newCouncil.website}
                  onChange={e => setNewCouncil(prev => ({ ...prev, website: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Physical Address / Civic Centre</Label>
              <Input
                placeholder="e.g. City Hall, Independence Avenue, Lusaka"
                value={newCouncil.address}
                onChange={e => setNewCouncil(prev => ({ ...prev, address: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCouncilModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#0F0F0F] text-[#F4C400] hover:bg-black font-bold">
                Onboard Council
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
