import React, { useState, useMemo } from "react";
import {
  MapPin, Globe, Download, Upload, Link as LinkIcon, RefreshCw, Search,
  SlidersHorizontal, ChevronLeft, ChevronRight, Layers, FileDown, CheckCircle,
  Eye, Check, X, AlertCircle, ArrowUpDown, ChevronDown, Sparkles, Building2,
  Trash2, Boxes, Database, FileSpreadsheet, CheckCircle2, Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useCountries } from "@/hooks/use-countries";
import {
  useBoundaries, useUploadBoundaries, useImportBoundariesFromUrl, useSyncGadm,
  useBoundaryDatasetsSummary, useSyncGeoBoundaries, useUploadHqCsv, useClearLevel,
  type BoundaryItem, type BoundaryDatasetItem
} from "@/hooks/use-boundaries";
import { useOrganization } from "@/contexts/organization-context";

export function BoundaryManagement() {
  const { data: countries = [] } = useCountries();
  const { organizations: councils = [] } = useOrganization();

  // Active filters
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("ZM");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [councilFilter, setCouncilFilter] = useState<string>("all");

  // Pagination & Sorting (Rule 24 Enterprise Table)
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortBy, setSortBy] = useState<string>("level");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Column Visibility (Rule 24)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    level: true,
    name: true,
    levelType: true,
    code: true,
    parentName: true,
    councilName: true,
    geometryType: true,
    source: true,
    actions: true,
  });

  // Modal dialog states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [hqCsvModalOpen, setHqCsvModalOpen] = useState(false);
  const [geoBoundariesModalOpen, setGeoBoundariesModalOpen] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [gadmModalOpen, setGadmModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [targetDeleteLevel, setTargetDeleteLevel] = useState<{ level: number; name: string; count: number } | null>(null);
  const [selectedBoundary, setSelectedBoundary] = useState<BoundaryItem | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileContent, setUploadFileContent] = useState<string>("");
  const [uploadLevel, setUploadLevel] = useState<number>(3);
  const [uploadLevelType, setUploadLevelType] = useState<string>("ward");
  const [uploadCouncilId, setUploadCouncilId] = useState<string>("");

  // HQ CSV state
  const [csvContent, setCsvContent] = useState<string>("");
  const [hqCsvLevel, setHqCsvLevel] = useState<number>(2);

  // GeoBoundaries state
  const [geoBoundariesLevel, setGeoBoundariesLevel] = useState<string>("ALL");

  // URL Import state
  const [importUrl, setImportUrl] = useState<string>("");
  const [importLevel, setImportLevel] = useState<number>(3);
  const [importLevelType, setImportLevelType] = useState<string>("ward");
  const [importCouncilId, setImportCouncilId] = useState<string>("");

  // Mutations
  const uploadMutation = useUploadBoundaries();
  const urlImportMutation = useImportBoundariesFromUrl();
  const syncGadmMutation = useSyncGadm();
  const syncGeoBoundariesMutation = useSyncGeoBoundaries();
  const uploadHqCsvMutation = useUploadHqCsv();
  const clearLevelMutation = useClearLevel();

  // Find active country record
  const activeCountry = useMemo(() => {
    return countries.find(c => c.countryCode === selectedCountryCode) || countries[0];
  }, [countries, selectedCountryCode]);

  // Query datasets summary for the active country (Modeled on VaxPlan Loaded Boundary Datasets card)
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useBoundaryDatasetsSummary(selectedCountryCode);

  // Query boundaries table
  const queryLevel = levelFilter === "all" ? undefined : parseInt(levelFilter, 10);
  const queryCouncil = councilFilter === "all" ? undefined : councilFilter;

  const { data, isLoading, refetch } = useBoundaries({
    countryCode: selectedCountryCode === "all" ? undefined : selectedCountryCode,
    level: queryLevel,
    councilId: queryCouncil,
    search: searchQuery.trim() || undefined,
    page,
    limit: pageSize,
    sortBy,
    sortDir,
  });

  const boundaries = data?.boundaries || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Sorting helper
  const handleSort = (colKey: string) => {
    if (sortBy === colKey) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(colKey);
      setSortDir("asc");
    }
    setPage(1);
  };

  // File drop/selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setUploadFileContent(text);
    };
    reader.readAsText(file);
  };

  // Submit file upload
  const handleUploadSubmit = async () => {
    if (!uploadFileContent) {
      toast({ title: "No file selected", description: "Please choose a GeoJSON or JSON file to upload.", variant: "destructive" });
      return;
    }

    try {
      let geojson: any;
      try {
        geojson = JSON.parse(uploadFileContent);
      } catch {
        toast({ title: "Invalid JSON", description: "The uploaded file does not contain valid GeoJSON or JSON syntax.", variant: "destructive" });
        return;
      }

      await uploadMutation.mutateAsync({
        countryId: activeCountry?.countryId,
        countryCode: selectedCountryCode,
        councilId: uploadCouncilId || undefined,
        level: uploadLevel,
        levelType: uploadLevelType,
        geojson,
      });

      toast({
        title: "Boundaries Uploaded Successfully",
        description: `Imported boundary geometries from ${uploadFile?.name || "file"}.`,
      });
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadFileContent("");
      refetch();
      refetchSummary();
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to process and store boundary geometries.",
        variant: "destructive",
      });
    }
  };

  // Submit HQ CSV upload
  const handleHqCsvSubmit = async () => {
    if (!csvContent.trim()) {
      toast({ title: "CSV content required", description: "Please paste CSV text or select a CSV file.", variant: "destructive" });
      return;
    }

    try {
      const result = await uploadHqCsvMutation.mutateAsync({
        csvContent,
        countryCode: selectedCountryCode,
        level: hqCsvLevel,
      });

      toast({
        title: "HQ CSV Processed",
        description: result.message || "Updated council and boundary headquarters coordinates.",
      });
      setHqCsvModalOpen(false);
      setCsvContent("");
      refetch();
      refetchSummary();
    } catch (err: any) {
      toast({
        title: "HQ CSV Processing Failed",
        description: err.message || "Failed to parse HQ CSV coordinates.",
        variant: "destructive",
      });
    }
  };

  // Submit GeoBoundaries Sync
  const handleGeoBoundariesSync = async () => {
    try {
      toast({
        title: "GeoBoundaries Fetching Started",
        description: `Contacting GeoBoundaries API for ${selectedCountryCode} (${geoBoundariesLevel})...`,
      });

      const res = await syncGeoBoundariesMutation.mutateAsync({
        countryCode: selectedCountryCode,
        countryId: activeCountry?.countryId,
        level: geoBoundariesLevel,
      });

      setGeoBoundariesModalOpen(false);
      refetch();
      refetchSummary();

      toast({
        title: "GeoBoundaries Synchronized",
        description: `Successfully pulled official open datasets for ${res.iso3}.`,
      });
    } catch (err: any) {
      toast({
        title: "GeoBoundaries Sync Failed",
        description: err.message || "Failed to fetch open boundaries from GeoBoundaries repository.",
        variant: "destructive",
      });
    }
  };

  // Submit URL / GitHub import
  const handleUrlImportSubmit = async () => {
    if (!importUrl) {
      toast({ title: "URL required", description: "Please enter a valid raw GitHub or GeoJSON URL.", variant: "destructive" });
      return;
    }

    try {
      await urlImportMutation.mutateAsync({
        url: importUrl,
        countryId: activeCountry?.countryId,
        countryCode: selectedCountryCode,
        councilId: importCouncilId || undefined,
        level: importLevel,
        levelType: importLevelType,
      });

      toast({
        title: "Import Completed",
        description: `Successfully fetched and imported boundary features from URL.`,
      });
      setUrlModalOpen(false);
      setImportUrl("");
      refetch();
      refetchSummary();
    } catch (err: any) {
      toast({
        title: "Import Failed",
        description: err.message || "Failed to fetch or parse boundaries from the provided URL.",
        variant: "destructive",
      });
    }
  };

  // Trigger GADM Sync
  const handleGadmSync = async () => {
    try {
      await syncGadmMutation.mutateAsync({
        countryCode: selectedCountryCode,
        countryId: activeCountry?.countryId,
      });
      toast({
        title: "GADM Sync Completed",
        description: `Pulled and synchronized official GADM 4.1 boundaries for ${selectedCountryCode}.`,
      });
      setGadmModalOpen(false);
      refetch();
      refetchSummary();
    } catch (err: any) {
      toast({
        title: "GADM Sync Failed",
        description: err.message || "Failed to synchronize boundaries from GADM.",
        variant: "destructive",
      });
    }
  };

  // Export specific level
  const handleExportLevel = (level: number) => {
    const downloadUrl = `/api/boundaries/export-level?countryCode=${selectedCountryCode}&level=${level}&format=geojson`;
    window.open(downloadUrl, "_blank");
    toast({
      title: "Export Initiated",
      description: `Downloading level ${level} boundary dataset for ${selectedCountryCode}.`,
    });
  };

  // Replace level (opens upload dialog prefilled with that level)
  const handleOpenReplace = (level: number, name: string) => {
    setUploadLevel(level);
    setUploadLevelType(level === 1 ? "province" : level === 2 ? "district" : "ward");
    setUploadModalOpen(true);
  };

  // Delete / Archive level
  const handleConfirmDelete = (level: number, name: string, count: number) => {
    setTargetDeleteLevel({ level, name, count });
    setDeleteConfirmOpen(true);
  };

  const handleExecuteDeleteLevel = async () => {
    if (!targetDeleteLevel) return;
    try {
      await clearLevelMutation.mutateAsync({
        countryCode: selectedCountryCode,
        level: targetDeleteLevel.level,
      });
      toast({
        title: "Dataset Cleared",
        description: `Successfully archived level ${targetDeleteLevel.level} features.`,
      });
      setDeleteConfirmOpen(false);
      setTargetDeleteLevel(null);
      refetch();
      refetchSummary();
    } catch (err: any) {
      toast({
        title: "Clear Failed",
        description: err.message || "Failed to clear boundary level.",
        variant: "destructive",
      });
    }
  };

  // Bulk download lowest-level boundaries for entire country
  const handleBulkDownload = () => {
    if (!activeCountry?.countryId) {
      toast({ title: "No Country Selected", description: "Please select a specific country to export boundaries.", variant: "destructive" });
      return;
    }
    const downloadUrl = `/api/countries/${activeCountry.countryId}/councils/lowest-boundaries-export?format=geojson`;
    window.open(downloadUrl, "_blank");
    toast({
      title: "Export Initiated",
      description: `Downloading lowest-level boundaries for all councils of ${activeCountry.name}.`,
    });
  };

  // Helper sample CSV content for headquarters
  const sampleHqCsv = `name,code,latitude,longitude,contact_address,contact_phone,contact_email
Lusaka City Council,LCC,-15.416667,28.283333,Independence Avenue Lusaka,+260211250000,info@lcc.gov.zm
Ndola City Council,NCC,-12.966667,28.633333,Broadway Avenue Ndola,+260212610000,info@ndola.gov.zm
Kitwe City Council,KCC,-12.800000,28.200000,Civic Centre Kitwe,+260212220000,info@kitwe.gov.zm`;

  return (
    <div className="space-y-6">
      {/* 1. Header Card matching VaxPlan Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <Layers className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Admin Boundary Manager
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Load GIS administrative boundaries for any country.
            </p>
          </div>
        </div>

        {/* Action Buttons as in screenshot */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Country selector */}
          <Select
            value={selectedCountryCode}
            onValueChange={(val) => {
              setSelectedCountryCode(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[150px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map(c => (
                <SelectItem key={c.countryCode} value={c.countryCode}>
                  {c.flagEmoji || "🏳"} {c.name} ({c.countryCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Upload HQ CSV button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHqCsvModalOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <MapPin className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            Upload HQ CSV
          </Button>

          {/* Upload GeoJSON button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUploadModalOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            Upload GeoJSON
          </Button>

          {/* Fetch from GeoBoundaries button (Primary Blue) */}
          <Button
            size="sm"
            onClick={() => setGeoBoundariesModalOpen(true)}
            className="h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Globe className="mr-1.5 h-3.5 w-3.5" />
            Fetch from GeoBoundaries
          </Button>

          {/* More options dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs uppercase text-slate-400">Advanced GIS Sources</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setGadmModalOpen(true)} className="text-xs cursor-pointer">
                <RefreshCw className="mr-2 h-3.5 w-3.5 text-amber-500" />
                Sync with GADM 4.1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setUrlModalOpen(true)} className="text-xs cursor-pointer">
                <LinkIcon className="mr-2 h-3.5 w-3.5 text-sky-500" />
                Link GitHub Raw / External URL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleBulkDownload} className="text-xs cursor-pointer font-semibold text-emerald-600">
                <FileDown className="mr-2 h-3.5 w-3.5" />
                Bulk Export All Lowest Levels
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 2. Loaded Boundary Datasets Card - Modeled directly on VaxPlan screenshot */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="py-4 px-6 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Boxes className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Loaded Boundary Datasets
              <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {summaryData?.datasets?.filter(d => d.level > 0)?.length || 0}
              </Badge>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              onClick={() => {
                refetchSummary();
                refetch();
                toast({ title: "Refreshing datasets...", description: "Checking database boundary records." });
              }}
              disabled={isSummaryLoading}
              title="Refresh loaded datasets"
            >
              <RefreshCw className={`h-4 w-4 ${isSummaryLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-3">
            {/* Show tiers: L1 (Province), L2 (District), L3 (Ward) */}
            {[
              { level: 1, name: "Province", defaultType: "province" },
              { level: 2, name: "District", defaultType: "district" },
              { level: 3, name: "Ward", defaultType: "ward" },
            ].map(tier => {
              const dataset = summaryData?.datasets?.find(d => d.level === tier.level);
              const iso3 = summaryData?.iso3 || "ZMB";

              if (dataset && dataset.featureCount > 0) {
                return (
                  <div
                    key={tier.level}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs shrink-0">
                        L{tier.level}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {dataset.name || tier.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {dataset.iso3 || iso3}
                          </Badge>
                          <Badge className="text-[11px] font-medium bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                            {dataset.source}
                          </Badge>
                          <Badge className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {dataset.featureCount.toLocaleString()} features · Updated {new Date(dataset.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium border-slate-200 hover:bg-slate-100 dark:border-slate-700"
                        onClick={() => handleOpenReplace(tier.level, dataset.name)}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1 text-slate-600" />
                        Replace
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium border-slate-200 hover:bg-slate-100 dark:border-slate-700"
                        onClick={() => handleExportLevel(tier.level)}
                      >
                        <Download className="h-3.5 w-3.5 mr-1 text-slate-600" />
                        Export
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                        onClick={() => handleConfirmDelete(tier.level, dataset.name, dataset.featureCount)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              }

              // Placeholder row when tier is not yet loaded
              return (
                <div
                  key={tier.level}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40 gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 font-bold text-xs shrink-0">
                      L{tier.level}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-500 dark:text-slate-400">
                          {tier.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-400">
                          {iso3}
                        </Badge>
                        <Badge variant="outline" className="text-[11px] font-normal text-slate-400 border-dashed">
                          Not Loaded
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        No {tier.name.toLowerCase()}-level features currently stored for {selectedCountryCode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-medium border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      onClick={() => handleOpenReplace(tier.level, tier.name)}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1 text-slate-500" />
                      Upload {tier.name}s
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-medium border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400"
                      onClick={() => {
                        setGeoBoundariesLevel(`ADM${tier.level}`);
                        setGeoBoundariesModalOpen(true);
                      }}
                    >
                      <Globe className="h-3.5 w-3.5 mr-1" />
                      Fetch L{tier.level}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Detailed Features Explorer & Enterprise Table (Rule 24 Compliant) */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Boundary Features Directory
                <Badge variant="outline" className="font-mono text-xs">
                  {total.toLocaleString()} records
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Inspect geometry bounding boxes, council linkage, centroids, and download individual boundary shapefiles.
              </CardDescription>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Level Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                {[
                  { id: "all", label: "All" },
                  { id: "0", label: "L0 Country" },
                  { id: "1", label: "L1 Province" },
                  { id: "2", label: "L2 District" },
                  { id: "3", label: "L3 Ward" },
                ].map(tier => (
                  <button
                    key={tier.id}
                    onClick={() => {
                      setLevelFilter(tier.id);
                      setPage(1);
                    }}
                    className={`px-2 py-1 font-semibold rounded transition-colors ${
                      levelFilter === tier.id
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>

              {/* Column Visibility Selector (Rule 24) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-medium border-slate-200 dark:border-slate-700">
                    <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Visible Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.keys(visibleColumns).map(col => (
                    <DropdownMenuCheckboxItem
                      key={col}
                      checked={visibleColumns[col]}
                      onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, [col]: !!checked }))}
                      className="text-xs capitalize"
                    >
                      {col.replace(/([A-Z])/g, ' $1')}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Page Size Selector (Rule 24: 10, 25, 50, 100) */}
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(parseInt(val, 10));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[95px] text-xs font-medium border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Page Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search bar & Council filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search boundaries by name, code, or province..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Council match filter */}
            <Select
              value={councilFilter}
              onValueChange={(val) => {
                setCouncilFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-full sm:w-[220px] text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="Filter by Council" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Councils</SelectItem>
                {councils.map(c => (
                  <SelectItem key={c.councilId} value={c.councilId}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {/* Table Content */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {visibleColumns.level && (
                    <th className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort("level")}>
                      <div className="flex items-center gap-1">
                        Tier
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.name && (
                    <th className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">
                        Name
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.levelType && (
                    <th className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort("levelType")}>
                      <div className="flex items-center gap-1">
                        Type
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.code && <th className="py-2.5 px-4">Code / GID</th>}
                  {visibleColumns.parentName && (
                    <th className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort("parentName")}>
                      <div className="flex items-center gap-1">
                        Parent Region
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.councilName && <th className="py-2.5 px-4">Associated Council</th>}
                  {visibleColumns.geometryType && <th className="py-2.5 px-4">Geometry</th>}
                  {visibleColumns.source && (
                    <th className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort("source")}>
                      <div className="flex items-center gap-1">
                        Source
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.actions && <th className="py-2.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                      Loading administrative boundaries...
                    </td>
                  </tr>
                ) : boundaries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <Layers className="h-8 w-8 mx-auto text-slate-400 mb-2 opacity-50" />
                      No boundaries match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  boundaries.map(b => (
                    <tr
                      key={b.boundary_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedBoundary(b);
                        setDetailModalOpen(true);
                      }}
                    >
                      {visibleColumns.level && (
                        <td className="py-2.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            b.level === 0 ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                            b.level === 1 ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                            b.level === 2 ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" :
                            "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}>
                            L{b.level}
                          </span>
                        </td>
                      )}
                      {visibleColumns.name && (
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {b.name}
                        </td>
                      )}
                      {visibleColumns.levelType && (
                        <td className="py-2.5 px-4 capitalize text-slate-600 dark:text-slate-400">
                          {b.level_type}
                        </td>
                      )}
                      {visibleColumns.code && (
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                          {b.code || "—"}
                        </td>
                      )}
                      {visibleColumns.parentName && (
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                          {b.parent_name || "—"}
                        </td>
                      )}
                      {visibleColumns.councilName && (
                        <td className="py-2.5 px-4">
                          {b.council_name ? (
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                              <Building2 className="h-3 w-3" />
                              {b.council_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.geometryType && (
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className="text-[10px] font-mono text-slate-600">
                            {b.geometry_type}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.source && (
                        <td className="py-2.5 px-4">
                          <Badge className="text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                            {b.source}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:text-blue-600"
                              onClick={() => {
                                window.open(`/api/boundaries/${b.boundary_id}/download?format=geojson`, "_blank");
                              }}
                              title="Download GeoJSON"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500 hover:text-slate-900"
                              onClick={() => {
                                setSelectedBoundary(b);
                                setDetailModalOpen(true);
                              }}
                              title="Inspect Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls (Rule 24) */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 gap-3 text-xs text-slate-500">
            <div>
              Showing {boundaries.length > 0 ? ((page - 1) * pageSize) + 1 : 0} to {Math.min(page * pageSize, total)} of {total.toLocaleString()} boundaries
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setPage(1)}
                disabled={page <= 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                Prev
              </Button>
              <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal 1: Fetch from GeoBoundaries (Modeled on VaxPlan) */}
      <Dialog open={geoBoundariesModalOpen} onOpenChange={setGeoBoundariesModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <DialogTitle className="text-lg font-bold">Fetch from GeoBoundaries</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Synchronize boundary datasets from William & Mary geoBoundaries open API (gbOpen).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Target Country</Label>
              <Input
                readOnly
                value={`${activeCountry?.name || "Zambia"} (${activeCountry?.countryCode || "ZM"} / ${summaryData?.iso3 || "ZMB"})`}
                className="h-8 text-xs bg-slate-50 dark:bg-slate-800 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Administrative Tier to Fetch</Label>
              <Select value={geoBoundariesLevel} onValueChange={setGeoBoundariesLevel}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Select Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Available Levels (ADM1 & ADM2)</SelectItem>
                  <SelectItem value="ADM1">ADM1 - Provinces / States</SelectItem>
                  <SelectItem value="ADM2">ADM2 - Districts / Local Councils</SelectItem>
                  <SelectItem value="ADM3">ADM3 - Wards / Communes (if available)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-500 mt-1">
                GeoBoundaries provides open CC-BY licensed boundaries with standardized boundary metadata.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setGeoBoundariesModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleGeoBoundariesSync}
              disabled={syncGeoBoundariesMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {syncGeoBoundariesMutation.isPending ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Fetching Datasets...
                </>
              ) : (
                <>
                  <Globe className="mr-1.5 h-3.5 w-3.5" />
                  Fetch Datasets
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Upload HQ CSV */}
      <Dialog open={hqCsvModalOpen} onOpenChange={setHqCsvModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600" />
              <DialogTitle className="text-lg font-bold">Upload Headquarters CSV</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Upload coordinates and addresses for council headquarters, district capitals, or ward offices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Target Level</Label>
                <Select value={String(hqCsvLevel)} onValueChange={(v) => setHqCsvLevel(parseInt(v, 10))}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 - Provincial Capitals</SelectItem>
                    <SelectItem value="2">Level 2 - District / Council HQs</SelectItem>
                    <SelectItem value="3">Level 3 - Ward Offices</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Country</Label>
                <Input readOnly value={selectedCountryCode} className="h-8 text-xs bg-slate-50 dark:bg-slate-800 mt-1 font-mono" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">CSV Content</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-blue-600 px-2"
                  onClick={() => {
                    setCsvContent(sampleHqCsv);
                    toast({ title: "Sample CSV Loaded", description: "Loaded example Zambia council coordinates." });
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Load Sample CSV
                </Button>
              </div>
              <Textarea
                placeholder={`name,code,latitude,longitude,contact_address,contact_phone\nLusaka City Council,LCC,-15.4166,28.2833,Independence Ave,+260...`}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                rows={6}
                className="font-mono text-xs mt-1"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                CSV headers must include at least: <code>name</code> and coordinates <code>latitude, longitude</code>.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setHqCsvModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleHqCsvSubmit}
              disabled={uploadHqCsvMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {uploadHqCsvMutation.isPending ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload & Match HQs
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Upload GeoJSON */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-600" />
              <DialogTitle className="text-lg font-bold">Upload Custom GeoJSON / Shapes</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Upload custom boundary geometries (e.g. Ward level 3 from HDX, ECZ, or local surveys).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Administrative Tier</Label>
                <Select
                  value={String(uploadLevel)}
                  onValueChange={(v) => {
                    const lvl = parseInt(v, 10);
                    setUploadLevel(lvl);
                    setUploadLevelType(lvl === 1 ? "province" : lvl === 2 ? "district" : "ward");
                  }}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">L1 - Province</SelectItem>
                    <SelectItem value="2">L2 - District / Council</SelectItem>
                    <SelectItem value="3">L3 - Ward / Sub-district</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Tier Descriptor</Label>
                <Input
                  value={uploadLevelType}
                  onChange={(e) => setUploadLevelType(e.target.value)}
                  className="h-8 text-xs mt-1"
                  placeholder="e.g. ward"
                />
              </div>
            </div>

            {uploadLevel === 3 && (
              <div>
                <Label className="text-xs font-semibold">Associated Council (Optional)</Label>
                <Select value={uploadCouncilId} onValueChange={setUploadCouncilId}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue placeholder="All / Unspecified Council" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Multi-council GeoJSON</SelectItem>
                    {councils.map(c => (
                      <SelectItem key={c.councilId} value={c.councilId}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold">Select GeoJSON / JSON File</Label>
              <Input
                type="file"
                accept=".json,.geojson"
                onChange={handleFileChange}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Or Paste Raw GeoJSON</Label>
              <Textarea
                placeholder='{"type": "FeatureCollection", "features": [...]}'
                value={uploadFileContent}
                onChange={(e) => setUploadFileContent(e.target.value)}
                rows={5}
                className="font-mono text-xs mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUploadSubmit}
              disabled={uploadMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {uploadMutation.isPending ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Import Boundaries
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Link GitHub / External URL */}
      <Dialog open={urlModalOpen} onOpenChange={setUrlModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-sky-600" />
              <DialogTitle className="text-lg font-bold">Import from GitHub / URL</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Directly fetch and import boundary polygons from a raw GitHub URL or open data portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Raw GeoJSON URL</Label>
              <Input
                placeholder="https://raw.githubusercontent.com/.../wards.geojson"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Tier Level</Label>
                <Select
                  value={String(importLevel)}
                  onValueChange={(v) => {
                    const lvl = parseInt(v, 10);
                    setImportLevel(lvl);
                    setImportLevelType(lvl === 1 ? "province" : lvl === 2 ? "district" : "ward");
                  }}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">L1 - Province</SelectItem>
                    <SelectItem value="2">L2 - District</SelectItem>
                    <SelectItem value="3">L3 - Ward</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Descriptor</Label>
                <Input
                  value={importLevelType}
                  onChange={(e) => setImportLevelType(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setUrlModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUrlImportSubmit}
              disabled={urlImportMutation.isPending}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              {urlImportMutation.isPending ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Fetch & Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 5: GADM Sync Confirmation */}
      <Dialog open={gadmModalOpen} onOpenChange={setGadmModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-amber-500" />
              <DialogTitle className="text-lg font-bold">Synchronize GADM 4.1 Boundaries</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Pull official GADM 4.1 spatial data directly from UC Davis geodata repository for {selectedCountryCode}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-slate-600 dark:text-slate-300">
            <p>
              This will upsert official administrative boundaries for <strong>Level 1 (Provinces)</strong> and <strong>Level 2 (Districts)</strong>.
            </p>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-800 dark:text-amber-300">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                Data Safety Confirmation
              </p>
              <p className="mt-1 text-[11px]">
                Existing customized boundaries are preserved. GADM records are safely upserted without dropping existing council records.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setGadmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleGadmSync}
              disabled={syncGadmMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {syncGadmMutation.isPending ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Syncing GADM...
                </>
              ) : (
                "Start GADM Sync"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 6: Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <DialogTitle className="text-lg font-bold">Archive Boundary Level</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Safely archive all {targetDeleteLevel?.count.toLocaleString()} features for Level {targetDeleteLevel?.level} ({targetDeleteLevel?.name}).
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-slate-600 dark:text-slate-300 py-2">
            In accordance with system data safety guidelines, features will be archived and hidden from active GIS layers, allowing you to re-sync or replace them cleanly without losing historical audit logs.
          </p>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteDeleteLevel}
              disabled={clearLevelMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {clearLevelMutation.isPending ? "Archiving..." : "Confirm Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 7: Detailed Boundary Inspector */}
      {selectedBoundary && (
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <DialogTitle className="text-lg font-bold">{selectedBoundary.name}</DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Administrative Level {selectedBoundary.level} ({selectedBoundary.level_type})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Code / GID</span>
                  <span className="font-mono font-semibold">{selectedBoundary.code || "—"}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Parent Region</span>
                  <span className="font-semibold">{selectedBoundary.parent_name || "—"}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Centroid Lat/Lng</span>
                  <span className="font-mono font-semibold">
                    {selectedBoundary.centroid ? `${selectedBoundary.centroid.lat}, ${selectedBoundary.centroid.lng}` : "—"}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Source Provider</span>
                  <span className="font-semibold">{selectedBoundary.source}</span>
                </div>
              </div>

              {selectedBoundary.bounding_box && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Bounding Box [W, S, E, N]</span>
                  <span className="font-mono text-[11px]">
                    [{selectedBoundary.bounding_box.map(n => n.toFixed(4)).join(", ")}]
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(`/api/boundaries/${selectedBoundary.boundary_id}/download?format=kml`, "_blank");
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download KML
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  window.open(`/api/boundaries/${selectedBoundary.boundary_id}/download?format=geojson`, "_blank");
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download GeoJSON
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
