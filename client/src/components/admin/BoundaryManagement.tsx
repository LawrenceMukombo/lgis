import React, { useState, useMemo } from "react";
import {
  MapPin, Globe, Download, Upload, Link as LinkIcon, RefreshCw, Search,
  SlidersHorizontal, ChevronLeft, ChevronRight, Layers, FileDown, CheckCircle,
  Eye, Check, X, AlertCircle, ArrowUpDown, ChevronDown, Sparkles, Building2
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
  type BoundaryItem
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
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [gadmModalOpen, setGadmModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBoundary, setSelectedBoundary] = useState<BoundaryItem | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileContent, setUploadFileContent] = useState<string>("");
  const [uploadLevel, setUploadLevel] = useState<number>(3);
  const [uploadLevelType, setUploadLevelType] = useState<string>("ward");
  const [uploadCouncilId, setUploadCouncilId] = useState<string>("");

  // URL Import state
  const [importUrl, setImportUrl] = useState<string>("");
  const [importLevel, setImportLevel] = useState<number>(3);
  const [importLevelType, setImportLevelType] = useState<string>("ward");
  const [importCouncilId, setImportCouncilId] = useState<string>("");

  // Mutations
  const uploadMutation = useUploadBoundaries();
  const urlImportMutation = useImportBoundariesFromUrl();
  const syncGadmMutation = useSyncGadm();

  // Find active country record
  const activeCountry = useMemo(() => {
    return countries.find(c => c.countryCode === selectedCountryCode) || countries[0];
  }, [countries, selectedCountryCode]);

  // Query boundaries
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
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to process and store boundary geometries.",
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
    } catch (err: any) {
      toast({
        title: "GADM Sync Failed",
        description: err.message || "Failed to synchronize boundaries from GADM.",
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

  return (
    <div className="space-y-6">
      {/* Header card with action buttons */}
      <Card className="border-2 border-foreground/10 bg-background-higher shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-accent-primary-default" />
                <CardTitle className="text-2xl font-bold uppercase tracking-tight">Administrative Boundaries</CardTitle>
                <Badge variant="outline" className="ml-2 font-mono text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                  GADM 4.1 + Custom GIS
                </Badge>
              </div>
              <CardDescription className="mt-1">
                Manage boundaries across all administrative tiers (Country, Province, District/Council, Ward). Download lowest-level boundary shapes, pull from GADM, upload custom shapefiles, or link to GitHub datasets.
              </CardDescription>
            </div>

            {/* Global Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGadmModalOpen(true)}
                className="h-9 font-semibold text-xs hover:bg-black/5"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-accent-primary-default" />
                Pull from GADM
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setUrlModalOpen(true)}
                className="h-9 font-semibold text-xs hover:bg-black/5"
              >
                <LinkIcon className="mr-1.5 h-3.5 w-3.5 text-sky-600" />
                Link GitHub / URL
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadModalOpen(true)}
                className="h-9 font-semibold text-xs hover:bg-black/5"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                Upload GeoJSON / Shapes
              </Button>

              <Button
                size="sm"
                onClick={handleBulkDownload}
                className="h-9 font-bold text-xs bg-[#0F0F0F] text-[#F4C400] hover:bg-black/90 shadow-sm"
              >
                <FileDown className="mr-1.5 h-4 w-4 text-[#F4C400]" />
                Download All Lowest Levels
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Filter controls bar */}
        <CardContent className="pt-0 border-t border-outline-dimmer/50">
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            {/* Left: Country filter & Level tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Country select */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-dimmer">Country:</span>
                <Select
                  value={selectedCountryCode}
                  onValueChange={(val) => {
                    setSelectedCountryCode(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-[170px] bg-background-default border-outline-dimmer font-medium text-xs">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌐 All Countries</SelectItem>
                    {countries.map(c => (
                      <SelectItem key={c.countryCode} value={c.countryCode}>
                        {c.flagEmoji || "🏳"} {c.name} ({c.countryCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Administrative Tier pill buttons */}
              <div className="flex items-center gap-1 bg-background-default p-1 rounded-lg border border-outline-dimmer">
                {[
                  { id: "all", label: "All Tiers" },
                  { id: "0", label: "Country (L0)" },
                  { id: "1", label: "Province (L1)" },
                  { id: "2", label: "District / Council (L2)" },
                  { id: "3", label: "Ward (L3)" },
                ].map(tier => (
                  <button
                    key={tier.id}
                    onClick={() => {
                      setLevelFilter(tier.id);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                      levelFilter === tier.id
                        ? "bg-[#0F0F0F] text-[#F4C400]"
                        : "text-foreground-dimmer hover:text-foreground-default hover:bg-black/5"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Search, Column Visibility, Council filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 md:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-foreground-dimmest" />
                <Input
                  placeholder="Search boundary or code..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 pl-8 text-xs bg-background-default border-outline-dimmer"
                />
              </div>

              {/* Column visibility dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 text-xs">
                    <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background-default">
                  <DropdownMenuLabel className="text-xs">Visible Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.level}
                    onCheckedChange={(v) => setVisibleColumns(prev => ({ ...prev, level: !!v }))}
                  >
                    Level
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.levelType}
                    onCheckedChange={(v) => setVisibleColumns(prev => ({ ...prev, levelType: !!v }))}
                  >
                    Tier Type
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.code}
                    onCheckedChange={(v) => setVisibleColumns(prev => ({ ...prev, code: !!v }))}
                  >
                    GID / Code
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.parentName}
                    onCheckedChange={(v) => setVisibleColumns(prev => ({ ...prev, parentName: !!v }))}
                  >
                    Parent Region
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.councilName}
                    onCheckedChange={(v) => setVisibleColumns(prev => ({ ...prev, councilName: !!v }))}
                  >
                    Council Link
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.source}
                    onCheckedChange={(v) => setVisibleColumns(prev => ({ ...prev, source: !!v }))}
                  >
                    Source
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enterprise Data Table (Rule 24 Compliant) */}
      <Card className="border border-outline-dimmer shadow-sm overflow-hidden bg-background-default">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline-dimmer bg-background-higher/50 text-foreground-dimmer font-bold uppercase tracking-wider">
                {visibleColumns.level && (
                  <th
                    onClick={() => handleSort("level")}
                    className="py-3 px-4 cursor-pointer hover:text-foreground-default select-none"
                  >
                    <div className="flex items-center gap-1">
                      Tier <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>
                )}
                {visibleColumns.name && (
                  <th
                    onClick={() => handleSort("name")}
                    className="py-3 px-4 cursor-pointer hover:text-foreground-default select-none"
                  >
                    <div className="flex items-center gap-1">
                      Boundary Name <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>
                )}
                {visibleColumns.levelType && (
                  <th className="py-3 px-4">Level Type</th>
                )}
                {visibleColumns.code && (
                  <th className="py-3 px-4">Code / GID</th>
                )}
                {visibleColumns.parentName && (
                  <th
                    onClick={() => handleSort("parentName")}
                    className="py-3 px-4 cursor-pointer hover:text-foreground-default select-none"
                  >
                    <div className="flex items-center gap-1">
                      Parent <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>
                )}
                {visibleColumns.councilName && (
                  <th className="py-3 px-4">Council Association</th>
                )}
                {visibleColumns.geometryType && (
                  <th className="py-3 px-4">Geometry</th>
                )}
                {visibleColumns.source && (
                  <th className="py-3 px-4">Source</th>
                )}
                {visibleColumns.actions && (
                  <th className="py-3 px-4 text-right">Actions / Download</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-dimmer/50">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-foreground-dimmer">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-accent-primary-default" />
                      <span>Loading administrative boundaries...</span>
                    </div>
                  </td>
                </tr>
              ) : boundaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-foreground-dimmer">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="h-8 w-8 text-foreground-dimmest" />
                      <span className="font-medium text-sm">No administrative boundaries found</span>
                      <p className="text-xs text-foreground-dimmest max-w-sm">
                        Use the "Pull from GADM" button above to pull official boundaries, or upload custom GeoJSON files.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                boundaries.map((b) => {
                  const levelBadgeColor =
                    b.level === 0 ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" :
                    b.level === 1 ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" :
                    b.level === 2 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" :
                    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";

                  const levelLabel =
                    b.level === 0 ? "National (L0)" :
                    b.level === 1 ? "Province (L1)" :
                    b.level === 2 ? "District (L2)" :
                    "Ward (L3)";

                  return (
                    <tr key={b.boundary_id} className="hover:bg-background-higher/50 transition-colors">
                      {visibleColumns.level && (
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant="outline" className={`font-mono text-[10px] ${levelBadgeColor}`}>
                            {levelLabel}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.name && (
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground-default">{b.name}</div>
                          {b.centroid && (
                            <div className="text-[10px] text-foreground-dimmest flex items-center gap-1 font-mono">
                              <MapPin className="h-2.5 w-2.5" />
                              {b.centroid.lat.toFixed(4)}, {b.centroid.lng.toFixed(4)}
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.levelType && (
                        <td className="py-3 px-4 uppercase text-[10px] font-bold tracking-wider text-foreground-dimmer">
                          {b.level_type}
                        </td>
                      )}
                      {visibleColumns.code && (
                        <td className="py-3 px-4 font-mono text-[11px] text-foreground-dimmer">
                          {b.code || "—"}
                        </td>
                      )}
                      {visibleColumns.parentName && (
                        <td className="py-3 px-4 text-foreground-dimmer">
                          {b.parent_name || "—"}
                        </td>
                      )}
                      {visibleColumns.councilName && (
                        <td className="py-3 px-4 text-foreground-default">
                          {b.council_name ? (
                            <div className="flex items-center gap-1 font-medium">
                              <Building2 className="h-3 w-3 text-accent-primary-default" />
                              {b.council_name}
                            </div>
                          ) : (
                            <span className="text-foreground-dimmest text-[10px]">Unlinked</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.geometryType && (
                        <td className="py-3 px-4">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-black/5 font-mono">
                            {b.geometry_type || "Polygon"}
                          </span>
                        </td>
                      )}
                      {visibleColumns.source && (
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {b.source}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect details button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBoundary(b);
                                setDetailModalOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                              title="View details and properties"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {/* Download menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-[11px] font-semibold border-outline-dimmer"
                                >
                                  <Download className="mr-1 h-3 w-3 text-accent-primary-default" />
                                  Download
                                  <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-background-default">
                                <DropdownMenuLabel className="text-xs">Download Boundary</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => window.open(`/api/boundaries/${b.boundary_id}/download?format=geojson`, "_blank")}
                                  className="cursor-pointer text-xs"
                                >
                                  Download GeoJSON (.geojson)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => window.open(`/api/boundaries/${b.boundary_id}/download?format=kml`, "_blank")}
                                  className="cursor-pointer text-xs"
                                >
                                  Download KML (Google Earth)
                                </DropdownMenuItem>

                                {/* If this boundary is linked to a council, offer lowest-level download */}
                                {b.council_id && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => window.open(`/api/councils/${b.council_id}/lowest-boundary?download=true`, "_blank")}
                                      className="cursor-pointer text-xs font-bold text-accent-primary-default"
                                    >
                                      Lowest Level Available (GeoJSON)
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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

        {/* Enterprise Pagination Bar (Rule 24) */}
        <div className="p-4 border-t border-outline-dimmer bg-background-higher/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-foreground-dimmer">
            <span>
              Showing <strong className="text-foreground-default">{boundaries.length}</strong> of{" "}
              <strong className="text-foreground-default">{total}</strong> boundaries
            </span>
            <div className="flex items-center gap-1.5 ml-4">
              <span>Per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-16 text-xs bg-background-default">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 px-2 text-xs"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="px-3 py-1 font-mono text-xs">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 px-2 text-xs"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* --- MODAL: Upload Custom Shapes / GeoJSON --- */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-md bg-background-default">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-600" />
              Upload Boundary Shapes / GeoJSON
            </DialogTitle>
            <DialogDescription>
              Upload custom ward, district, or municipal boundary polygons in GeoJSON format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <Label className="text-xs">Administrative Level</Label>
              <Select
                value={String(uploadLevel)}
                onValueChange={(val) => {
                  const num = Number(val);
                  setUploadLevel(num);
                  setUploadLevelType(num === 3 ? "ward" : num === 2 ? "district" : num === 1 ? "province" : "country");
                }}
              >
                <SelectTrigger className="mt-1 h-9 bg-background-default">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Level 3: Ward (Lowest Electoral/Local)</SelectItem>
                  <SelectItem value="2">Level 2: District / Council</SelectItem>
                  <SelectItem value="1">Level 1: Province / Region</SelectItem>
                  <SelectItem value="0">Level 0: Country Boundary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uploadLevel >= 2 && (
              <div>
                <Label className="text-xs">Associate with Council (Optional)</Label>
                <Select value={uploadCouncilId} onValueChange={setUploadCouncilId}>
                  <SelectTrigger className="mt-1 h-9 bg-background-default">
                    <SelectValue placeholder="Select Council..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="">None / Unassociated</SelectItem>
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
              <Label className="text-xs">Select File (.geojson or .json)</Label>
              <Input
                type="file"
                accept=".geojson,.json"
                onChange={handleFileChange}
                className="mt-1 text-xs cursor-pointer"
              />
              {uploadFile && (
                <p className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                  <CheckCircle className="h-3 w-3" /> Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setUploadModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleUploadSubmit}
              disabled={!uploadFileContent || uploadMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {uploadMutation.isPending ? "Processing..." : "Import Features"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL: Link GitHub / External URL --- */}
      <Dialog open={urlModalOpen} onOpenChange={setUrlModalOpen}>
        <DialogContent className="max-w-md bg-background-default">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-sky-600" />
              Import from GitHub / External URL
            </DialogTitle>
            <DialogDescription>
              Seamlessly link and pull boundary polygons from any raw GitHub file or public GeoJSON endpoint.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <Label className="text-xs">Raw GeoJSON URL</Label>
              <Input
                placeholder="https://raw.githubusercontent.com/.../wards.geojson"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="mt-1 h-9 text-xs font-mono"
              />
              <p className="text-[10px] text-foreground-dimmest mt-1">
                Tip: Enter a raw GitHub file URL or humanitarian dataset link (HDX, UNAIDS, GADM).
              </p>
            </div>

            <div>
              <Label className="text-xs">Target Administrative Level</Label>
              <Select
                value={String(importLevel)}
                onValueChange={(val) => {
                  const num = Number(val);
                  setImportLevel(num);
                  setImportLevelType(num === 3 ? "ward" : num === 2 ? "district" : "province");
                }}
              >
                <SelectTrigger className="mt-1 h-9 bg-background-default">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Level 3: Ward (Lowest level)</SelectItem>
                  <SelectItem value="2">Level 2: District / Council</SelectItem>
                  <SelectItem value="1">Level 1: Province</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {importLevel >= 2 && (
              <div>
                <Label className="text-xs">Associate with Council (Optional)</Label>
                <Select value={importCouncilId} onValueChange={setImportCouncilId}>
                  <SelectTrigger className="mt-1 h-9 bg-background-default">
                    <SelectValue placeholder="Select Council..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="">All / Auto-associate</SelectItem>
                    {councils.map(c => (
                      <SelectItem key={c.councilId} value={c.councilId}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setUrlModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleUrlImportSubmit}
              disabled={!importUrl.trim() || urlImportMutation.isPending}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
            >
              {urlImportMutation.isPending ? "Fetching & Importing..." : "Fetch and Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL: Pull from GADM 4.1 --- */}
      <Dialog open={gadmModalOpen} onOpenChange={setGadmModalOpen}>
        <DialogContent className="max-w-md bg-background-default">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-accent-primary-default" />
              Pull from GADM 4.1 Repository
            </DialogTitle>
            <DialogDescription>
              Directly pull and synchronize official national, provincial, and district boundaries from the Database of Global Administrative Areas (geodata.ucdavis.edu).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="bg-background-higher p-3 rounded-lg border border-outline-dimmer space-y-1">
              <div className="font-semibold text-foreground-default">Target Country:</div>
              <div className="text-sm font-bold text-accent-primary-default flex items-center gap-2">
                {activeCountry?.flagEmoji || "🇿🇲"} {activeCountry?.name || "Zambia"} ({selectedCountryCode})
              </div>
              <p className="text-[11px] text-foreground-dimmest mt-1">
                This will pull and sync GADM Level 0 (Country boundary), Level 1 (Provinces), and Level 2 (all 115 Districts) with exact high-resolution coordinates and bounding boxes.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setGadmModalOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleGadmSync}
              disabled={syncGadmMutation.isPending}
              className="bg-[#0F0F0F] text-[#F4C400] hover:bg-black/90 font-bold"
            >
              {syncGadmMutation.isPending ? "Synchronizing GADM..." : "Start GADM Sync"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL: Detailed Boundary Inspection --- */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-lg bg-background-default">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-accent-primary-default" />
              Boundary Details: {selectedBoundary?.name}
            </DialogTitle>
            <DialogDescription>
              Administrative Tier: Level {selectedBoundary?.level} ({selectedBoundary?.level_type})
            </DialogDescription>
          </DialogHeader>

          {selectedBoundary && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-background-higher p-3 rounded-lg border border-outline-dimmer font-mono text-[11px]">
                <div>
                  <span className="text-foreground-dimmest block text-[10px] uppercase">Country</span>
                  <strong>{selectedBoundary.country_code}</strong>
                </div>
                <div>
                  <span className="text-foreground-dimmest block text-[10px] uppercase">GID / Code</span>
                  <strong>{selectedBoundary.code || "—"}</strong>
                </div>
                <div>
                  <span className="text-foreground-dimmest block text-[10px] uppercase">Parent Region</span>
                  <strong>{selectedBoundary.parent_name || "—"}</strong>
                </div>
                <div>
                  <span className="text-foreground-dimmest block text-[10px] uppercase">Source</span>
                  <strong>{selectedBoundary.source}</strong>
                </div>
                <div>
                  <span className="text-foreground-dimmest block text-[10px] uppercase">Geometry Type</span>
                  <strong>{selectedBoundary.geometry_type}</strong>
                </div>
                <div>
                  <span className="text-foreground-dimmest block text-[10px] uppercase">Council Association</span>
                  <strong>{selectedBoundary.council_name || "Unlinked"}</strong>
                </div>
              </div>

              {selectedBoundary.centroid && (
                <div className="p-3 bg-background-higher rounded-lg border border-outline-dimmer">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-foreground-dimmer mb-1">Centroid Coordinates</div>
                  <div className="font-mono text-xs">
                    Lat: {selectedBoundary.centroid.lat}, Lng: {selectedBoundary.centroid.lng}
                  </div>
                </div>
              )}

              {selectedBoundary.bounding_box && (
                <div className="p-3 bg-background-higher rounded-lg border border-outline-dimmer">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-foreground-dimmer mb-1">Bounding Box [minLng, minLat, maxLng, maxLat]</div>
                  <div className="font-mono text-[11px] break-all">
                    [{selectedBoundary.bounding_box.join(", ")}]
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/boundaries/${selectedBoundary.boundary_id}/download?format=geojson`, "_blank")}
                >
                  <Download className="mr-1 h-3.5 w-3.5" /> GeoJSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/boundaries/${selectedBoundary.boundary_id}/download?format=kml`, "_blank")}
                >
                  <Download className="mr-1 h-3.5 w-3.5" /> KML
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDetailModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
