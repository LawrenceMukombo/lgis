import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, MoreHorizontal, MapPin, Loader2, X, Eye, Pencil, UserX } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PROVINCES, PROVINCES_AND_DISTRICTS } from "@/lib/location-data";
import { BusinessLocationMap } from "@/components/BusinessLocationMap";
import { useOrganization } from "@/contexts/organization-context";

interface Citizen {
  citizenId: string;
  councilId: string;
  nationalId: string | null;
  localCitizenNo: string | null;
  firstName: string;
  lastName: string;
  dob: string | null;
  sex: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  section: string | null;
  lot: string | null;
  block: string | null;
  suburb: string | null;
  village: string | null;
  district: string | null;
  province: string | null;
  nationality: string | null;
  status: string | null;
  createdAt: string;
}

interface Business {
  businessId: string;
  councilId: string;
  registrationNo: string | null;
  tin: string | null;
  legalName: string;
  tradingName: string | null;
  businessType: string | null;
  industry: string | null;
  ownerName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  physicalAddress: string | null;
  section: string | null;
  lot: string | null;
  block: string | null;
  suburb: string | null;
  village: string | null;
  district: string | null;
  province: string | null;
  status: string | null;
  isForeignEnterprise: boolean | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

interface Asset {
  assetId: string;
  councilId: string;
  assetNo: string;
  name: string;
  type: string;
  location: string | null;
  condition: string | null;
  value: string | null;
  status: string | null;
}

interface CitizenFormData {
  firstName: string;
  lastName: string;
  nationalId: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  section: string;
  lot: string;
  block: string;
  suburb: string;
  village: string;
  district: string;
  province: string;
  nationality: string;
}

interface BusinessFormData {
  legalName: string;
  tradingName: string;
  tin: string;
  businessType: string;
  ownerName: string;
  industry: string;
  contactPhone: string;
  contactEmail: string;
  physicalAddress: string;
  section: string;
  lot: string;
  block: string;
  suburb: string;
  village: string;
  district: string;
  province: string;
  status: string;
  registrationNo: string;
  isForeignEnterprise?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

const initialCitizenForm: CitizenFormData = {
  firstName: "", lastName: "", nationalId: "", dob: "",
  phone: "", email: "", address: "", section: "", lot: "", block: "", suburb: "",
  village: "", district: "", province: "", nationality: "Zambia"
};

const initialBusinessForm: BusinessFormData = {
  legalName: "", tradingName: "", tin: "", businessType: "",
  ownerName: "", industry: "", contactPhone: "", contactEmail: "",
  physicalAddress: "", section: "", lot: "", block: "", suburb: "",
  village: "", district: "", province: "",
  status: "active", registrationNo: "",
  isForeignEnterprise: false,
  latitude: null,
  longitude: null
};

interface AssetFormData {
  name: string;
  type: string;
  location: string;
  condition: string;
  value: string;
  status: string;
  assetNo: string;
}

const initialAssetForm: AssetFormData = {
  name: "", type: "", location: "", condition: "", value: "", status: "active", assetNo: ""
};

export default function RegistryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("businesses");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit">("view");
  const [showNewCitizenModal, setShowNewCitizenModal] = useState(false);
  const [showNewBusinessModal, setShowNewBusinessModal] = useState(false);

  // Generate options for Section and Lot (1-100)
  const numberOptions = Array.from({ length: 100 }, (_, i) => String(i + 1).padStart(2, '0'));

  const [citizenForm, setCitizenForm] = useState<CitizenFormData>(initialCitizenForm);
  const [businessForm, setBusinessForm] = useState<BusinessFormData>(initialBusinessForm);
  const [assetForm, setAssetForm] = useState<AssetFormData>(initialAssetForm);
  const [editCitizenForm, setEditCitizenForm] = useState<CitizenFormData>(initialCitizenForm);
  const [editBusinessForm, setEditBusinessForm] = useState<BusinessFormData>(initialBusinessForm);
  const [editAssetForm, setEditAssetForm] = useState<AssetFormData>(initialAssetForm);
  const [showNewAssetModal, setShowNewAssetModal] = useState(false);
  const { currentOrganization } = useOrganization();
  const activeCouncilId = currentOrganization?.councilId;

  const { data: citizens = [], isLoading: loadingCitizens } = useQuery<Citizen[]>({
    queryKey: ["/api/citizens", activeCouncilId],
    queryFn: async () => {
      const url = activeCouncilId ? `/api/citizens?councilId=${activeCouncilId}` : "/api/citizens";
      const res = await apiRequest("GET", url);
      return res.json();
    }
  });

  const { data: businesses = [], isLoading: loadingBusinesses } = useQuery<Business[]>({
    queryKey: ["/api/businesses", activeCouncilId],
    queryFn: async () => {
      const url = activeCouncilId ? `/api/businesses?councilId=${activeCouncilId}` : "/api/businesses";
      const res = await apiRequest("GET", url);
      return res.json();
    }
  });

  const { data: assets = [], isLoading: loadingAssets } = useQuery<Asset[]>({
    queryKey: ["/api/assets", activeCouncilId],
    queryFn: async () => {
      const url = activeCouncilId ? `/api/assets?councilId=${activeCouncilId}` : "/api/assets";
      const res = await apiRequest("GET", url);
      return res.json();
    }
  });

  interface Council {
    councilId: string;
    name: string;
  }

  const { data: councils = [] } = useQuery<Council[]>({
    queryKey: ["/api/councils"],
  });

  const defaultCouncilId = activeCouncilId || (councils.length > 0 ? councils[0].councilId : "");

  const createCitizenMutation = useMutation({
    mutationFn: async (data: CitizenFormData) => {
      const response = await apiRequest("POST", "/api/citizens", {
        organizationId: defaultCouncilId,
        fullName: `${data.firstName} ${data.lastName}`,
        ...data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/citizens"] });
      toast({ title: "Success", description: "Citizen registered successfully." });
      setShowNewCitizenModal(false);
      setCitizenForm(initialCitizenForm);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to register citizen.", variant: "destructive" });
    },
  });

  const updateCitizenMutation = useMutation({
    mutationFn: async ({ citizenId, data }: { citizenId: string; data: Partial<CitizenFormData> }) => {
      const response = await apiRequest("PATCH", `/api/citizens/${citizenId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/citizens"] });
      toast({ title: "Success", description: "Citizen record updated." });
      setSelectedCitizen(null);
      setViewMode("view");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update citizen.", variant: "destructive" });
    },
  });

  const deactivateCitizenMutation = useMutation({
    mutationFn: async (citizenId: string) => {
      const response = await apiRequest("PATCH", `/api/citizens/${citizenId}`, { status: "inactive" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/citizens"] });
      toast({ title: "Deactivated", description: "Citizen record has been deactivated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to deactivate citizen.", variant: "destructive" });
    },
  });

  const createBusinessMutation = useMutation({
    mutationFn: async (data: BusinessFormData) => {
      const response = await apiRequest("POST", "/api/businesses", {
        organizationId: defaultCouncilId,
        businessName: data.legalName,
        tradingAs: data.tradingName,
        tinNumber: data.tin,
        isForeignEnterprise: data.isForeignEnterprise,
        ...data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({ title: "Success", description: "Business registered successfully." });
      setShowNewBusinessModal(false);
      setBusinessForm(initialBusinessForm);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to register business.", variant: "destructive" });
    },
  });

  const updateBusinessMutation = useMutation({
    mutationFn: async ({ businessId, data }: { businessId: string; data: Partial<BusinessFormData> }) => {
      const response = await apiRequest("PATCH", `/api/businesses/${businessId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({ title: "Success", description: "Business record updated." });
      setSelectedBusiness(null);
      setViewMode("view");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update business.", variant: "destructive" });
    },
  });

  const deactivateBusinessMutation = useMutation({
    mutationFn: async (businessId: string) => {
      const response = await apiRequest("PATCH", `/api/businesses/${businessId}`, { status: "inactive" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({ title: "Deactivated", description: "Business record has been deactivated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to deactivate business.", variant: "destructive" });
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data: AssetFormData) => {
      const response = await apiRequest("POST", "/api/assets", {
        councilId: defaultCouncilId,
        ...data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: "Success", description: "Asset registered successfully." });
      setShowNewAssetModal(false);
      setAssetForm(initialAssetForm);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to register asset.", variant: "destructive" });
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ assetId, data }: { assetId: string; data: Partial<AssetFormData> }) => {
      const response = await apiRequest("PATCH", `/api/assets/${assetId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: "Success", description: "Asset record updated." });
      setSelectedAsset(null);
      setViewMode("view");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update asset.", variant: "destructive" });
    },
  });

  const filteredCitizens = citizens.filter(c => {
    const matchesSearch = searchTerm === "" ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nationalId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.localCitizenNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = searchTerm === "" ||
      b.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.tradingName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.tin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.registrationNo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAssets = assets.filter(a => {
    const matchesSearch = searchTerm === "" ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.assetNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleNewRegistration = () => {
    if (activeTab === "citizens") {
      setCitizenForm(initialCitizenForm);
      setShowNewCitizenModal(true);
    } else if (activeTab === "businesses") {
      setBusinessForm(initialBusinessForm);
      setShowNewBusinessModal(true);
    } else if (activeTab === "assets") {
      setAssetForm(initialAssetForm);
      setShowNewAssetModal(true);
    }
  };

  const handleCreateAsset = () => {
    if (!assetForm.name || !assetForm.type) {
      toast({ title: "Error", description: "Name and Type are required.", variant: "destructive" });
      return;
    }
    createAssetMutation.mutate(assetForm);
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setEditAssetForm({
      name: asset.name || "",
      type: asset.type || "",
      location: asset.location || "",
      condition: asset.condition || "",
      value: asset.value || "",
      status: asset.status || "active",
      assetNo: asset.assetNo || "",
    });
    setViewMode("edit");
  };

  const handleSaveAsset = () => {
    if (selectedAsset) {
      updateAssetMutation.mutate({ assetId: selectedAsset.assetId, data: editAssetForm });
    }
  };

  const handleViewCitizen = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setViewMode("view");
  };

  const handleEditCitizen = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setEditCitizenForm({
      firstName: citizen.firstName || "",
      lastName: citizen.lastName || "",
      nationalId: citizen.nationalId || "",
      dob: citizen.dob || "",
      phone: citizen.phone || "",
      email: citizen.email || "",
      address: citizen.address || "",
      section: citizen.section || "",
      lot: citizen.lot || "",
      block: citizen.block || "",
      suburb: citizen.suburb || "",
      village: citizen.village || "",
      district: citizen.district || "",
      province: citizen.province || "",
      nationality: citizen.nationality || "PNG",
    });
    setViewMode("edit");
  };

  const handleViewBusiness = (business: Business) => {
    setSelectedBusiness(business);
    setViewMode("view");
  };

  const handleEditBusiness = (business: Business) => {
    setSelectedBusiness(business);
    setEditBusinessForm({
      legalName: business.legalName || "",
      tradingName: business.tradingName || "",
      tin: business.tin || "",
      businessType: business.businessType || "",
      ownerName: business.ownerName || "",
      industry: business.industry || "",
      contactPhone: business.contactPhone || "",
      contactEmail: business.contactEmail || "",
      physicalAddress: business.physicalAddress || "",
      section: business.section || "",
      lot: business.lot || "",
      block: business.block || "",
      suburb: business.suburb || "",
      village: business.village || "",
      district: business.district || "",
      province: business.province || "",
      status: business.status || "active",
      registrationNo: business.registrationNo || "",
      isForeignEnterprise: business.isForeignEnterprise ?? false,
      latitude: business.latitude,
      longitude: business.longitude
    });
    setViewMode("edit");
  };

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setViewMode("view");
  };

  const handleDeactivateCitizen = (citizenId: string) => {
    deactivateCitizenMutation.mutate(citizenId);
  };

  const handleDeactivateBusiness = (businessId: string) => {
    deactivateBusinessMutation.mutate(businessId);
  };

  const handleSaveCitizen = () => {
    if (selectedCitizen) {
      updateCitizenMutation.mutate({ citizenId: selectedCitizen.citizenId, data: editCitizenForm });
    }
  };

  const handleSaveBusiness = () => {
    if (selectedBusiness) {
      updateBusinessMutation.mutate({ businessId: selectedBusiness.businessId, data: editBusinessForm });
    }
  };

  const handleCreateCitizen = () => {
    if (!citizenForm.firstName || !citizenForm.lastName) {
      toast({ title: "Error", description: "First name and last name are required.", variant: "destructive" });
      return;
    }
    createCitizenMutation.mutate(citizenForm);
  };

  const handleCreateBusiness = () => {
    if (!businessForm.legalName) {
      toast({ title: "Error", description: "Legal name is required.", variant: "destructive" });
      return;
    }
    createBusinessMutation.mutate(businessForm);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "approved":
      case "registered":
        return <Badge variant="outline" className="bg-positive-dimmest text-positive border-positive-dimmer">Active</Badge>;
      case "pending":
      case "under review":
        return <Badge variant="outline" className="bg-warning-dimmest text-warning border-warning-dimmer">Pending</Badge>;
      case "inactive":
      case "suspended":
      case "closed":
        return <Badge variant="outline" className="bg-background-higher text-foreground-dimmer border-outline-dimmer">Inactive</Badge>;
      default:
        return <Badge variant="outline" className="bg-positive-dimmest text-positive border-positive-dimmer">Active</Badge>;
    }
  };

  const getConditionBadge = (condition: string | null) => {
    switch (condition?.toLowerCase()) {
      case "excellent":
        return <Badge variant="outline" className="bg-positive-dimmest text-positive border-positive-dimmer">Excellent</Badge>;
      case "good":
        return <Badge variant="outline" className="bg-accent-primary-dimmest text-accent-primary-default border-accent-primary-dimmer">Good</Badge>;
      case "fair":
        return <Badge variant="outline" className="bg-warning-dimmest text-warning border-warning-dimmer">Fair</Badge>;
      case "poor":
        return <Badge variant="outline" className="bg-negative-dimmest text-negative border-negative-dimmer">Poor</Badge>;
      default:
        return <Badge variant="outline" className="text-foreground-dimmer border-outline-dimmer">{condition || "Unknown"}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="gov-page-header">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight">Registry</h1>
          <p className="flex items-center mt-2 text-sm opacity-90">Manage citizen and business records across {currentOrganization?.name || "the council"}.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleNewRegistration}
            data-testid="button-new-registration"
            className="btn-primary shadow-lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Registration
          </Button>
        </div>
      </div>

      <div className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-background-higher border-outline-dimmer rounded-xl p-1 gap-1 border">
            {['citizens', 'businesses', 'assets'].map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-lg px-6 data-[state=active]:bg-accent-primary-default data-[state=active]:text-background-default transition-all"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'citizens' ? filteredCitizens.length : tab === 'businesses' ? filteredBusinesses.length : filteredAssets.length})
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center space-x-2 py-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by Name, ID, or TIN..."
                className="pl-9 w-full md:w-[300px] rounded-xl border transition-all border-outline-dimmer bg-background-higher text-foreground-default"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="citizens" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Registered Citizens</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCitizens ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-background-higher">
                        <TableHead className="text-foreground-dimmer">Name</TableHead>
                        <TableHead className="text-foreground-dimmer">National ID</TableHead>
                        <TableHead className="text-foreground-dimmer">Contact</TableHead>
                        <TableHead className="text-foreground-dimmer">Address</TableHead>
                        <TableHead className="text-foreground-dimmer">Status</TableHead>
                        <TableHead className="text-right text-foreground-dimmer">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCitizens.map((citizen) => (
                        <TableRow
                          key={citizen.citizenId}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewCitizen(citizen)}
                          data-testid={`row-citizen-${citizen.citizenId}`}
                        >
                          <TableCell className="font-medium">
                            {citizen.firstName} {citizen.lastName}
                          </TableCell>
                          <TableCell>{citizen.nationalId || citizen.localCitizenNo || "—"}</TableCell>
                          <TableCell>
                            <div className="text-sm">{citizen.phone || "—"}</div>
                            <div className="text-xs text-muted-foreground">{citizen.email || ""}</div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{citizen.address || "—"}</TableCell>
                          <TableCell>{getStatusBadge(citizen.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" data-testid={`button-actions-citizen-${citizen.citizenId}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewCitizen(citizen); }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditCitizen(citizen); }}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Record
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => { e.stopPropagation(); handleDeactivateCitizen(citizen.citizenId); }}
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredCitizens.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No citizens found matching your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="businesses" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Registered Businesses</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingBusinesses ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-background-higher">
                        <TableHead className="text-foreground-dimmer">Business Name</TableHead>
                        <TableHead className="text-foreground-dimmer">TIN</TableHead>
                        <TableHead className="text-foreground-dimmer">Type</TableHead>
                        <TableHead className="text-foreground-dimmer">Owner</TableHead>
                        <TableHead className="text-foreground-dimmer">Status</TableHead>
                        <TableHead className="text-right text-foreground-dimmer">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBusinesses.map((business) => (
                        <TableRow
                          key={business.businessId}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewBusiness(business)}
                          data-testid={`row-business-${business.businessId}`}
                        >
                          <TableCell>
                            <div className="font-medium">{business.legalName}</div>
                            {business.tradingName && (
                              <div className="text-xs text-muted-foreground">Trading as: {business.tradingName}</div>
                            )}
                          </TableCell>
                          <TableCell>{business.tin || "—"}</TableCell>
                          <TableCell>{business.businessType || "—"}</TableCell>
                          <TableCell>{business.ownerName || "—"}</TableCell>
                          <TableCell>{getStatusBadge(business.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" data-testid={`button-actions-business-${business.businessId}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewBusiness(business); }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditBusiness(business); }}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Record
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => { e.stopPropagation(); handleDeactivateBusiness(business.businessId); }}
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredBusinesses.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No businesses found matching your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assets & Facilities</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAssets ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: 'var(--background-higher)' }}>
                        <TableHead style={{ color: 'var(--foreground-dimmer)' }}>Asset ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssets.map((asset) => (
                        <TableRow
                          key={asset.assetId}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewAsset(asset)}
                          data-testid={`row-asset-${asset.assetId}`}
                        >
                          <TableCell className="font-mono text-sm">{asset.assetNo}</TableCell>
                          <TableCell className="font-medium">{asset.name}</TableCell>
                          <TableCell>{asset.type}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {asset.location || "—"}
                            </div>
                          </TableCell>
                          <TableCell>{getConditionBadge(asset.condition)}</TableCell>
                          <TableCell>{asset.value || "—"}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewAsset(asset); }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditAsset(asset); }}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Record
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredAssets.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No assets found matching your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedCitizen} onOpenChange={(open) => { if (!open) { setSelectedCitizen(null); setViewMode("view"); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewMode === "view" ? "Citizen Profile" : "Edit Citizen"}
            </DialogTitle>
            <DialogDescription>
              {viewMode === "view" ? "View citizen record information" : "Update citizen information"}
            </DialogDescription>
          </DialogHeader>
          {selectedCitizen && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Citizen ID</Label>
                  <p className="font-mono text-sm">{selectedCitizen.localCitizenNo || selectedCitizen.citizenId}</p>
                </div>
                <div className="hidden"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  {viewMode === "edit" ? (
                    <Input
                      value={editCitizenForm.firstName}
                      onChange={(e) => setEditCitizenForm(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{selectedCitizen.firstName}</p>
                  )}
                </div>
                <div>
                  <Label>Last Name</Label>
                  {viewMode === "edit" ? (
                    <Input
                      value={editCitizenForm.lastName}
                      onChange={(e) => setEditCitizenForm(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{selectedCitizen.lastName}</p>
                  )}
                </div>
              </div>
              {/* Location Details (Province -> District -> Village -> Suburb) */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Province</Label>
                  {viewMode === "edit" ? (
                    <Select
                      value={editCitizenForm.province}
                      onValueChange={(val) => setEditCitizenForm(prev => ({ ...prev, province: val, district: "" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map((province) => (
                          <SelectItem key={province} value={province}>{province}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{selectedCitizen.province || "—"}</p>
                  )}
                </div>
                <div>
                  <Label>District</Label>
                  {viewMode === "edit" ? (
                    <Select
                      value={editCitizenForm.district}
                      onValueChange={(val) => setEditCitizenForm(prev => ({ ...prev, district: val }))}
                      disabled={!editCitizenForm.province}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {editCitizenForm.province && PROVINCES_AND_DISTRICTS[editCitizenForm.province]?.map((district) => (
                          <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{selectedCitizen.district || "—"}</p>
                  )}
                </div>
                <div>
                  <Label>Village/LLG</Label>
                  {viewMode === "edit" ? (
                    <Input
                      value={editCitizenForm.village}
                      onChange={(e) => setEditCitizenForm(prev => ({ ...prev, village: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{selectedCitizen.village || "—"}</p>
                  )}
                </div>
                <div>
                  <Label>Suburb</Label>
                  {viewMode === "edit" ? (
                    <Input
                      value={editCitizenForm.suburb}
                      onChange={(e) => setEditCitizenForm(prev => ({ ...prev, suburb: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{selectedCitizen.suburb || "—"}</p>
                  )}
                </div>
              </div>

              {/* Address Details (Section -> Lot -> Block -> Street) */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Section</Label>
                  {viewMode === "edit" ? (
                    <Select
                      value={editCitizenForm.section}
                      onValueChange={(val) => setEditCitizenForm(prev => ({ ...prev, section: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sec" />
                      </SelectTrigger>
                      <SelectContent>
                        {numberOptions.map((num) => (
                          <SelectItem key={`sec-edit-${num}`} value={num}>{num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{selectedCitizen.section || "—"}</p>
                  )}
                </div>
                <div>
                  <Label>Lot</Label>
                  {viewMode === "edit" ? (
                    <Select
                      value={editCitizenForm.lot}
                      onValueChange={(val) => setEditCitizenForm(prev => ({ ...prev, lot: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Lot" />
                      </SelectTrigger>
                      <SelectContent>
                        {numberOptions.map((num) => (
                          <SelectItem key={`lot-edit-${num}`} value={num}>{num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{selectedCitizen.lot || "—"}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Nationality</Label>
                  {viewMode === "edit" ? (
                    <Input
                      value={editCitizenForm.nationality}
                      onChange={(e) => setEditCitizenForm(prev => ({ ...prev, nationality: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{selectedCitizen.nationality || "—"}</p>
                  )}
                </div>
                <div>
                  <Label>National ID</Label>
                  {viewMode === "edit" ? (
                    <Input
                      value={editCitizenForm.nationalId}
                      onChange={(e) => setEditCitizenForm(prev => ({ ...prev, nationalId: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{selectedCitizen.nationalId || "Not provided"}</p>
                  )}
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  {viewMode === "edit" ? (
                    <Input
                      type="date"
                      value={editCitizenForm.dob}
                      onChange={(e) => setEditCitizenForm(prev => ({ ...prev, dob: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{selectedCitizen.dob ? new Date(selectedCitizen.dob).toLocaleDateString() : "Not provided"}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Block</Label>
                  {viewMode === "edit" ? (
                    <Input
                      value={editCitizenForm.block}
                      onChange={(e) => setEditCitizenForm(prev => ({ ...prev, block: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{selectedCitizen.block || "—"}</p>
                  )}
                </div>
                <div>
                  <Label>Street</Label>
                  {viewMode === "edit" ? (
                    <Input
                      value={editCitizenForm.address}
                      onChange={(e) => setEditCitizenForm(prev => ({ ...prev, address: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{selectedCitizen.address || "Not provided"}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  {viewMode === "edit" ? (
                    <Input
                      value={editCitizenForm.phone}
                      onChange={(e) => setEditCitizenForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{selectedCitizen.phone || "Not provided"}</p>
                  )}
                </div>
                <div>
                  <Label>Email</Label>
                  {viewMode === "edit" ? (
                    <Input
                      value={editCitizenForm.email}
                      onChange={(e) => setEditCitizenForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{selectedCitizen.email || "Not provided"}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {viewMode === "view" ? (
              <>
                <Button variant="outline" onClick={() => setSelectedCitizen(null)}>Close</Button>
                <Button onClick={() => { if (selectedCitizen) handleEditCitizen(selectedCitizen); }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setViewMode("view")}>Cancel</Button>
                <Button
                  onClick={handleSaveCitizen}
                  disabled={updateCitizenMutation.isPending}
                >
                  {updateCitizenMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedBusiness} onOpenChange={(open) => { if (!open) { setSelectedBusiness(null); setViewMode("view"); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewMode === "view" ? "Business Profile" : "Edit Business"}
            </DialogTitle>
            <DialogDescription>
              {viewMode === "view" ? "View business record information" : "Update business information"}
            </DialogDescription>
          </DialogHeader>
          {selectedBusiness && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Registration No</Label>
                    {viewMode === "edit" ? (
                      <Input
                        value={editBusinessForm.registrationNo}
                        onChange={(e) => setEditBusinessForm(prev => ({ ...prev, registrationNo: e.target.value }))}
                      />
                    ) : (
                      <p className="font-mono text-sm">{selectedBusiness.registrationNo || selectedBusiness.businessId}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">TIN</Label>
                    {viewMode === "edit" ? (
                      <Input
                        value={editBusinessForm.tin}
                        onChange={(e) => setEditBusinessForm(prev => ({ ...prev, tin: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium">{selectedBusiness.tin || "Not provided"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Legal Name</Label>
                    {viewMode === "edit" ? (
                      <Input
                        value={editBusinessForm.legalName}
                        onChange={(e) => setEditBusinessForm(prev => ({ ...prev, legalName: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium">{selectedBusiness.legalName}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Trading Name</Label>
                    {viewMode === "edit" ? (
                      <Input
                        value={editBusinessForm.tradingName}
                        onChange={(e) => setEditBusinessForm(prev => ({ ...prev, tradingName: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium">{selectedBusiness.tradingName || "—"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Origin</Label>
                    {viewMode === "edit" ? (
                      <Select
                        value={editBusinessForm.isForeignEnterprise ? "international" : "local"}
                        onValueChange={(val) => setEditBusinessForm(prev => ({ ...prev, isForeignEnterprise: val === "international" }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select origin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local Enterprise</SelectItem>
                          <SelectItem value="international">International/Foreign Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{selectedBusiness.isForeignEnterprise ? "International" : "Local"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Business Type</Label>
                    {viewMode === "edit" ? (
                      <Select
                        value={editBusinessForm.businessType}
                        onValueChange={(val) => setEditBusinessForm(prev => ({ ...prev, businessType: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="sole_trader">Sole Trader</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="ngo">NGO</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{selectedBusiness.businessType || "—"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Industry</Label>
                    {viewMode === "edit" ? (
                      <Input
                        value={editBusinessForm.industry}
                        onChange={(e) => setEditBusinessForm(prev => ({ ...prev, industry: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium">{selectedBusiness.industry || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Owner Name</Label>
                    {viewMode === "edit" ? (
                      <Input
                        value={editBusinessForm.ownerName}
                        onChange={(e) => setEditBusinessForm(prev => ({ ...prev, ownerName: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium">{selectedBusiness.ownerName || "—"}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  {viewMode === "edit" ? (
                    <Select
                      value={editBusinessForm.status}
                      onValueChange={(val) => setEditBusinessForm(prev => ({ ...prev, status: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">{getStatusBadge(selectedBusiness.status)}</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Contact Phone</Label>
                    {viewMode === "edit" ? (
                      <Input
                        value={editBusinessForm.contactPhone}
                        onChange={(e) => setEditBusinessForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium">{selectedBusiness.contactPhone || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Contact Email</Label>
                    {viewMode === "edit" ? (
                      <Input
                        value={editBusinessForm.contactEmail}
                        onChange={(e) => setEditBusinessForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium">{selectedBusiness.contactEmail || "—"}</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="location" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Location Map</Label>
                  <div className="rounded-md overflow-hidden border">
                    <BusinessLocationMap
                      latitude={viewMode === "edit" ? (editBusinessForm.latitude || null) : (selectedBusiness.latitude || null)}
                      longitude={viewMode === "edit" ? (editBusinessForm.longitude || null) : (selectedBusiness.longitude || null)}
                      onLocationChange={(lat, lng) => {
                        if (viewMode === "edit") {
                          setEditBusinessForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
                        }
                      }}
                      height="200px"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Province</Label>
                    {viewMode === "edit" ? (
                      <Select
                        value={editBusinessForm.province}
                        onValueChange={(val) => setEditBusinessForm(prev => ({ ...prev, province: val, district: "" }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVINCES.map((province) => (
                            <SelectItem key={`biz-edit-prov-${province}`} value={province}>{province}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{selectedBusiness.province || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">District</Label>
                    {viewMode === "edit" ? (
                      <Select
                        value={editBusinessForm.district}
                        onValueChange={(val) => setEditBusinessForm(prev => ({ ...prev, district: val }))}
                        disabled={!editBusinessForm.province}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {editBusinessForm.province && PROVINCES_AND_DISTRICTS[editBusinessForm.province]?.map((district) => (
                            <SelectItem key={`biz-edit-dist-${district}`} value={district}>{district}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{selectedBusiness.district || "—"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Section</Label>
                    {viewMode === "edit" ? (
                      <Select
                        value={editBusinessForm.section}
                        onValueChange={(val) => setEditBusinessForm(prev => ({ ...prev, section: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sec" />
                        </SelectTrigger>
                        <SelectContent>
                          {numberOptions.map((num) => (
                            <SelectItem key={`biz-edit-sec-${num}`} value={num}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{selectedBusiness.section || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Lot</Label>
                    {viewMode === "edit" ? (
                      <Select
                        value={editBusinessForm.lot}
                        onValueChange={(val) => setEditBusinessForm(prev => ({ ...prev, lot: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Lot" />
                        </SelectTrigger>
                        <SelectContent>
                          {numberOptions.map((num) => (
                            <SelectItem key={`biz-edit-lot-${num}`} value={num}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{selectedBusiness.lot || "—"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Suburb</Label>
                    {viewMode === "edit" ? (
                      <Input
                        value={editBusinessForm.suburb}
                        onChange={(e) => setEditBusinessForm(prev => ({ ...prev, suburb: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium">{selectedBusiness.suburb || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Address Detail</Label>
                    {viewMode === "edit" ? (
                      <Input
                        value={editBusinessForm.physicalAddress}
                        onChange={(e) => setEditBusinessForm(prev => ({ ...prev, physicalAddress: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium">{selectedBusiness.physicalAddress || "—"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Block</Label>
                    {viewMode === "edit" ? (
                      <Input
                        value={editBusinessForm.block}
                        onChange={(e) => setEditBusinessForm(prev => ({ ...prev, block: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium">{selectedBusiness.block || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Village/LLG</Label>
                    {viewMode === "edit" ? (
                      <Input
                        value={editBusinessForm.village}
                        onChange={(e) => setEditBusinessForm(prev => ({ ...prev, village: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium">{selectedBusiness.village || "—"}</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            {viewMode === "view" ? (
              <>
                <Button variant="outline" onClick={() => setSelectedBusiness(null)}>Close</Button>
                <Button onClick={() => { if (selectedBusiness) handleEditBusiness(selectedBusiness); }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setViewMode("view")}>Cancel</Button>
                <Button
                  onClick={handleSaveBusiness}
                  disabled={updateBusinessMutation.isPending}
                >
                  {updateBusinessMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAsset} onOpenChange={(open) => { if (!open) { setSelectedAsset(null); setViewMode("view"); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {viewMode === "view" ? "Asset Details" : "Edit Asset"}
            </DialogTitle>
            <DialogDescription>
              {viewMode === "view" ? "View asset information" : "Update asset information"}
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Asset ID</Label>
                  {viewMode === "edit" ? (
                    <Input
                      value={editAssetForm.assetNo}
                      onChange={(e) => setEditAssetForm(prev => ({ ...prev, assetNo: e.target.value }))}
                    />
                  ) : (
                    <p className="font-mono text-sm">{selectedAsset.assetNo}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Type</Label>
                  {viewMode === "edit" ? (
                    <Input
                      value={editAssetForm.type}
                      onChange={(e) => setEditAssetForm(prev => ({ ...prev, type: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{selectedAsset.type}</p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Name</Label>
                {viewMode === "edit" ? (
                  <Input
                    value={editAssetForm.name}
                    onChange={(e) => setEditAssetForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium">{selectedAsset.name}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Location</Label>
                  {viewMode === "edit" ? (
                    <Input
                      value={editAssetForm.location}
                      onChange={(e) => setEditAssetForm(prev => ({ ...prev, location: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{selectedAsset.location || "—"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Condition</Label>
                  {viewMode === "edit" ? (
                    <Select
                      value={editAssetForm.condition}
                      onValueChange={(val) => setEditAssetForm(prev => ({ ...prev, condition: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">{getConditionBadge(selectedAsset.condition)}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Value</Label>
                  {viewMode === "edit" ? (
                    <Input
                      value={editAssetForm.value}
                      onChange={(e) => setEditAssetForm(prev => ({ ...prev, value: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium text-lg">{selectedAsset.value || "—"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  {viewMode === "edit" ? (
                    <Select
                      value={editAssetForm.status}
                      onValueChange={(val) => setEditAssetForm(prev => ({ ...prev, status: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      <Badge variant="outline">{selectedAsset.status}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {viewMode === "view" ? (
              <>
                <Button variant="outline" onClick={() => setSelectedAsset(null)}>Close</Button>
                <Button onClick={() => { if (selectedAsset) handleEditAsset(selectedAsset); }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setViewMode("view")}>Cancel</Button>
                <Button
                  onClick={handleSaveAsset}
                  disabled={updateAssetMutation.isPending}
                >
                  {updateAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewCitizenModal} onOpenChange={setShowNewCitizenModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Citizen Registration</DialogTitle>
            <DialogDescription>Register a new citizen in the system</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input
                  placeholder="John"
                  value={citizenForm.firstName}
                  onChange={(e) => setCitizenForm(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  placeholder="Doe"
                  value={citizenForm.lastName}
                  onChange={(e) => setCitizenForm(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            {/* Location Details (Province -> District -> Village -> Suburb) */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Province</Label>
                <Select
                  value={citizenForm.province}
                  onValueChange={(val) => setCitizenForm(prev => ({ ...prev, province: val, district: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((province) => (
                      <SelectItem key={province} value={province}>{province}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>District</Label>
                <Select
                  value={citizenForm.district}
                  onValueChange={(val) => setCitizenForm(prev => ({ ...prev, district: val }))}
                  disabled={!citizenForm.province}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {citizenForm.province && PROVINCES_AND_DISTRICTS[citizenForm.province]?.map((district) => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Village/LLG</Label>
                <Input
                  placeholder="Village"
                  value={citizenForm.village}
                  onChange={(e) => setCitizenForm(prev => ({ ...prev, village: e.target.value }))}
                />
              </div>
              <div>
                <Label>Suburb</Label>
                <Input
                  placeholder="Suburb"
                  value={citizenForm.suburb}
                  onChange={(e) => setCitizenForm(prev => ({ ...prev, suburb: e.target.value }))}
                />
              </div>
            </div>

            {/* Address Details (Section -> Lot -> Block -> Street) */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Section</Label>
                <Select
                  value={citizenForm.section}
                  onValueChange={(val) => setCitizenForm(prev => ({ ...prev, section: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sec" />
                  </SelectTrigger>
                  <SelectContent>
                    {numberOptions.map((num) => (
                      <SelectItem key={`sec-${num}`} value={num}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lot</Label>
                <Select
                  value={citizenForm.lot}
                  onValueChange={(val) => setCitizenForm(prev => ({ ...prev, lot: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Lot" />
                  </SelectTrigger>
                  <SelectContent>
                    {numberOptions.map((num) => (
                      <SelectItem key={`lot-${num}`} value={num}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Block</Label>
                <Input
                  placeholder="Block"
                  value={citizenForm.block}
                  onChange={(e) => setCitizenForm(prev => ({ ...prev, block: e.target.value }))}
                />
              </div>
              <div>
                <Label>Street</Label>
                <Input
                  placeholder="Street"
                  value={citizenForm.address}
                  onChange={(e) => setCitizenForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Nationality</Label>
                <Input
                  placeholder="e.g. PNG"
                  value={citizenForm.nationality}
                  onChange={(e) => setCitizenForm(prev => ({ ...prev, nationality: e.target.value }))}
                />
              </div>
              <div>
                <Label>National ID</Label>
                <Input
                  placeholder="NID Number"
                  value={citizenForm.nationalId}
                  onChange={(e) => setCitizenForm(prev => ({ ...prev, nationalId: e.target.value }))}
                />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={citizenForm.dob}
                  onChange={(e) => setCitizenForm(prev => ({ ...prev, dob: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  placeholder="+675 ..."
                  value={citizenForm.phone}
                  onChange={(e) => setCitizenForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={citizenForm.email}
                  onChange={(e) => setCitizenForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCitizenModal(false)}>Cancel</Button>
            <Button
              onClick={handleCreateCitizen}
              disabled={createCitizenMutation.isPending}
            >
              {createCitizenMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Citizen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewBusinessModal} onOpenChange={setShowNewBusinessModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Business Registration</DialogTitle>
            <DialogDescription>Register a new business in the system</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Legal Name *</Label>
                  <Input
                    placeholder="Company legal name"
                    value={businessForm.legalName}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, legalName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trading Name</Label>
                  <Input
                    placeholder="Trading as..."
                    value={businessForm.tradingName}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, tradingName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>TIN</Label>
                  <Input
                    placeholder="Tax Identification Number"
                    value={businessForm.tin}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, tin: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Origin *</Label>
                  <Select
                    value={businessForm.isForeignEnterprise ? "international" : "local"}
                    onValueChange={(val) => setBusinessForm(prev => ({ ...prev, isForeignEnterprise: val === "international" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select origin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local Enterprise</SelectItem>
                      <SelectItem value="international">International/Foreign Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Type</Label>
                  <Select value={businessForm.businessType} onValueChange={(val) => setBusinessForm(prev => ({ ...prev, businessType: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="sole_trader">Sole Trader</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="ngo">NGO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input
                    placeholder="e.g. Retail, Healthcare"
                    value={businessForm.industry}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, industry: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Owner Name</Label>
                <Input
                  placeholder="Primary owner name"
                  value={businessForm.ownerName}
                  onChange={(e) => setBusinessForm(prev => ({ ...prev, ownerName: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    placeholder="+675 XXX XXXX"
                    value={businessForm.contactPhone}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    placeholder="business@example.com"
                    value={businessForm.contactEmail}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 py-4">
              {/* GPS Location Map */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">GPS Location</Label>
                <div className="rounded-md overflow-hidden border">
                  <BusinessLocationMap
                    latitude={businessForm.latitude || null}
                    longitude={businessForm.longitude || null}
                    onLocationChange={(lat, lng) => setBusinessForm(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                    height="200px"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Province</Label>
                  <Select
                    value={businessForm.province}
                    onValueChange={(val) => setBusinessForm(prev => ({ ...prev, province: val, district: "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((province) => (
                        <SelectItem key={`biz-prov-${province}`} value={province}>{province}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>District</Label>
                  <Select
                    value={businessForm.district}
                    onValueChange={(val) => setBusinessForm(prev => ({ ...prev, district: val }))}
                    disabled={!businessForm.province}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessForm.province && PROVINCES_AND_DISTRICTS[businessForm.province]?.map((district) => (
                        <SelectItem key={`biz-dist-${district}`} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select
                    value={businessForm.section}
                    onValueChange={(val) => setBusinessForm(prev => ({ ...prev, section: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sec" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {numberOptions.map((num) => (
                        <SelectItem key={`biz-sec-${num}`} value={num}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lot</Label>
                  <Select
                    value={businessForm.lot}
                    onValueChange={(val) => setBusinessForm(prev => ({ ...prev, lot: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Lot" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {numberOptions.map((num) => (
                        <SelectItem key={`biz-lot-${num}`} value={num}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Suburb</Label>
                  <Input
                    placeholder="Suburb"
                    value={businessForm.suburb}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, suburb: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address Detail</Label>
                  <Input
                    placeholder="Block/Building/Street details"
                    value={businessForm.physicalAddress}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, physicalAddress: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Block</Label>
                  <Input
                    placeholder="Block"
                    value={businessForm.block}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, block: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Village/LLG</Label>
                  <Input
                    placeholder="Village"
                    value={businessForm.village}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, village: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBusinessModal(false)}>Cancel</Button>
            <Button
              onClick={handleCreateBusiness}
              disabled={createBusinessMutation.isPending}
            >
              {createBusinessMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Business
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showNewAssetModal} onOpenChange={setShowNewAssetModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Asset Registration</DialogTitle>
            <DialogDescription>Register a new asset or facility</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Asset Name *</Label>
                <Input
                  placeholder="e.g. City Hall Generator"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Asset Type *</Label>
                <Input
                  placeholder="e.g. Equipment, Building"
                  value={assetForm.type}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, type: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Asset No / Tag</Label>
                <Input
                  placeholder="Asset ID"
                  value={assetForm.assetNo}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, assetNo: e.target.value }))}
                />
              </div>
              <div>
                <Label>Condition</Label>
                <Select
                  value={assetForm.condition}
                  onValueChange={(val) => setAssetForm(prev => ({ ...prev, condition: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                placeholder="Physical location"
                value={assetForm.location}
                onChange={(e) => setAssetForm(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estimated Value (PGK)</Label>
                <Input
                  placeholder="0.00"
                  value={assetForm.value}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, value: e.target.value }))}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={assetForm.status}
                  onValueChange={(val) => setAssetForm(prev => ({ ...prev, status: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewAssetModal(false)}>Cancel</Button>
            <Button
              onClick={handleCreateAsset}
              disabled={createAssetMutation.isPending}
            >
              {createAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout >
  );
}
