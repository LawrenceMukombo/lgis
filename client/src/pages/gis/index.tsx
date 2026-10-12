import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Layers, Map as MapIcon, Loader2, Navigation, Building2, FileText, CheckCircle2, Clock, XCircle, AlertCircle, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BoundaryManagement } from "@/components/admin/BoundaryManagement";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, CircleMarker, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";

// Fix leafleft marker icons
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import markerRetina from "leaflet/dist/images/marker-icon-2x.png";

const defaultIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function GISPage() {
  const [activeTab, setActiveTab] = useState("businesses");
  const [, setLocation] = useLocation();

  // Map center and zoom state
  const [mapCenter, setMapCenter] = useState<[number, number]>([-15.4167, 28.2833]); // Lusaka default
  const [mapZoom, setMapZoom] = useState<number>(12);

  // Parse URL parameters on mount and update map
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLat = urlParams.get('lat');
    const urlLng = urlParams.get('lng');
    const urlZoom = urlParams.get('zoom');

    if (urlLat && urlLng) {
      setMapCenter([parseFloat(urlLat), parseFloat(urlLng)]);
    }
    if (urlZoom) {
      setMapZoom(parseInt(urlZoom));
    }
  }, []);

  // Layer States
  const [layers, setLayers] = useState({
    coreData: true,
    zoning: false,
    flood: false
  });

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const { data: businesses, isLoading: loadingBusinesses } = useQuery({
    queryKey: ["/api/v1/businesses"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/v1/businesses");
      return res.json();
    }
  });

  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ["/api/v1/requests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/v1/requests");
      return res.json();
    }
  });

  // Filter businesses with valid coordinates
  const businessMarkers = businesses?.filter((b: any) =>
    b.latitude && b.longitude &&
    !isNaN(parseFloat(b.latitude)) &&
    !isNaN(parseFloat(b.longitude))
  ) || [];

  // Map requests to businesses to get location
  const rawRequestMarkers = requests?.map((r: any) => {
    if (!r.businessId && !r.entityId) return null;

    const business = businesses?.find((b: any) => b.businessId === (r.businessId || r.entityId));

    if (business && business.latitude && business.longitude) {
      // Simple random jitter (approx 10-20 meters) to avoid visual stacking
      const jitterLat = (Math.random() - 0.5) * 0.0002;
      const jitterLng = (Math.random() - 0.5) * 0.0002;

      return {
        ...r,
        ...business,
        latitude: parseFloat(business.latitude) + jitterLat,
        longitude: parseFloat(business.longitude) + jitterLng,
        requestStatus: r.status,
        year: r.submittedAt ? new Date(r.submittedAt).getFullYear() : new Date().getFullYear()
      };
    }
    return null;
  }).filter(Boolean) || [];

  // Filter for Uniqueness: One app per type per year per business
  // This visualizes the business rule that prevents duplicate applications
  const requestMarkers = Object.values(rawRequestMarkers.reduce((acc: any, curr: any) => {
    const year = curr.year;
    // Use serviceId (application type) and year as unique constraints per business
    const key = `${curr.businessId}-${curr.serviceId || 'unknown'}-${year}`;

    // If duplicate found, keep the one with the latest submission date
    if (!acc[key] || (curr.submittedAt && new Date(curr.submittedAt) > new Date(acc[key].submittedAt))) {
      acc[key] = curr;
    }
    return acc;
  }, {}));

  // Mock GIS Data for Layers
  const zoningPolygon: [number, number][] = [
    [-9.42, 147.15],
    [-9.45, 147.16],
    [-9.46, 147.20],
    [-9.43, 147.21],
  ];

  const floodPolygon: [number, number][] = [
    [-9.47, 147.15],
    [-9.48, 147.16],
    [-9.48, 147.18],
    [-9.49, 147.15],
  ];

  const defaultCenter: [number, number] = [-9.4438, 147.1803]; // Port Moresby

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981'; // Emerald 500
      case 'rejected': return '#ef4444'; // Red 500
      case 'processing': return '#3b82f6'; // Blue 500
      case 'submitted': return '#eab308'; // Yellow 500
      default: return '#6b7280'; // Gray 500
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <MainLayout>
      <div className="gov-page-header">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">GIS & Mapping Intelligence</h2>
          <p className="font-medium opacity-90">Geospatial visualization of council assets, businesses, and licensing activities.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gold text-gold font-bold">
            <Layers className="mr-2 h-4 w-4" />
            Active: {activeTab === 'businesses' ? 'Business Layer' : 'Application Layer'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="businesses" className="space-y-4" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center bg-white p-2 rounded-lg border shadow-sm">
          <TabsList className="bg-muted/20">
            <TabsTrigger value="businesses" className="data-[state=active]:bg-[#0F0F0F] data-[state=active]:text-[#F4C400] font-bold">
              <Building2 className="mr-2 h-4 w-4" />
              Registered Businesses
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-[#0F0F0F] data-[state=active]:text-[#F4C400] font-bold">
              <FileText className="mr-2 h-4 w-4" />
              License Applications
            </TabsTrigger>
            <TabsTrigger value="boundaries" className="data-[state=active]:bg-[#0F0F0F] data-[state=active]:text-[#F4C400] font-bold">
              <Globe className="mr-2 h-4 w-4" />
              Boundaries & Shapes
            </TabsTrigger>
          </TabsList>

          <div className="text-sm font-medium px-4 flex items-center gap-2">
            <span className="text-muted-foreground">Map Source:</span>
            <Badge variant="outline" className="font-mono">Satellite (ESRI)</Badge>
            {/* DEBUG INDICATOR */}
            <Badge variant="secondary" className="font-mono text-xs">
              Loaded: {businessMarkers.length} Bus | {requestMarkers.length} Apps
            </Badge>
          </div>
        </div>

        {activeTab === "boundaries" ? (
          <BoundaryManagement />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-280px)] min-h-[600px]">
          <Card className="lg:col-span-3 h-full overflow-hidden relative border border-input shadow-md p-0 bg-black">
            {loadingBusinesses || loadingRequests ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
                <Loader2 className="h-10 w-10 animate-spin text-[#F4C400]" />
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
              >
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked name="Satellite (ESRI)">
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="OpenStreetMap">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Topographic">
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                      attribution="Tiles &copy; Esri &mdash; &copy; OpenStreetMap"
                    />
                  </LayersControl.BaseLayer>
                </LayersControl>

                {/* VISIBILITY LAYERS */}
                {layers.zoning && (
                  <Polygon
                    positions={zoningPolygon}
                    pathOptions={{ color: 'purple', fillColor: 'purple', fillOpacity: 0.2, weight: 2, dashArray: '5, 5' }}
                  >
                    <Popup>Zoning District: Industrial Zone A</Popup>
                  </Polygon>
                )}

                {layers.flood && (
                  <Polygon
                    positions={floodPolygon}
                    pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.4, weight: 1 }}
                  >
                    <Popup>High Risk Flood Zone (Coastal A)</Popup>
                  </Polygon>
                )}


                {layers.coreData && (
                  <>
                    <TabsContent value="businesses" className="m-0 p-0 h-full w-full">
                      {businessMarkers.map((business: any) => (
                        <CircleMarker
                          key={business.businessId}
                          center={[parseFloat(business.latitude), parseFloat(business.longitude)]}
                          radius={8}
                          pathOptions={{
                            color: "white",
                            fillColor: "#F4C400",
                            fillOpacity: 1,
                            weight: 2
                          }}
                        >
                          <Popup>
                            <div className="p-2 space-y-2 min-w-[200px]">
                              <div className="flex items-center gap-2 border-b pb-2">
                                <Building2 className="h-4 w-4 text-[#F4C400]" />
                                <h4 className="font-black text-sm uppercase">{business.tradingName || business.legalName}</h4>
                              </div>
                              <Badge variant="outline" className="text-xs bg-slate-100">{business.industry || 'General'}</Badge>
                              <p className="text-xs text-muted-foreground">{business.physicalAddress}</p>
                              <div className="text-xs pt-1 mt-1 font-mono">
                                Reg No: {business.registrationNo}
                              </div>
                              <Button
                                size="sm"
                                className="w-full h-7 bg-[#0F0F0F] text-[#F4C400] text-xs hover:bg-black/80"
                                onClick={() => setLocation(`/registry/business/${business.businessId}`)}
                              >
                                View Details
                              </Button>
                            </div>
                          </Popup>
                        </CircleMarker>
                      ))}
                    </TabsContent>

                    <TabsContent value="applications" className="m-0 p-0 h-full w-full">
                      {requestMarkers.map((req: any, idx: number) => (
                        <CircleMarker
                          key={req.requestId || idx}
                          center={[req.latitude, req.longitude]}
                          pathOptions={{
                            color: getStatusColor(req.requestStatus),
                            fillColor: getStatusColor(req.requestStatus),
                            fillOpacity: 0.7,
                            weight: 2
                          }}
                          radius={12}
                        >
                          <Popup>
                            <div className="p-2 space-y-2 min-w-[200px]">
                              <div className="flex items-center gap-2 border-b pb-2">
                                <FileText className="h-4 w-4 text-[#F4C400]" />
                                <h4 className="font-black text-sm uppercase">Application #{req.requestRef || 'REF'}</h4>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold">Status:</span>
                                <Badge className="capitalize" style={{ backgroundColor: getStatusColor(req.requestStatus) }}>
                                  {req.requestStatus}
                                </Badge>
                              </div>
                              <p className="text-xs font-medium">Applicant: {req.formData?.businessName || req.formData?.applicantName || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">{req.physicalAddress}</p>
                              <Button
                                size="sm"
                                className="w-full h-7 bg-[#0F0F0F] text-[#F4C400] text-xs hover:bg-black/80"
                                onClick={() => setLocation(`/licensing/request-details/${req.requestId}`)}
                              >
                                Process Application
                              </Button>
                            </div>
                          </Popup>
                        </CircleMarker>
                      ))}
                    </TabsContent>
                  </>
                )}

              </MapContainer>
            )}

            <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur p-2 px-4 rounded-md shadow border border-[#F4C400] text-xs z-[1000] text-white">
              <strong className="text-[#F4C400]">
                {activeTab === 'businesses' ? businessMarkers.length : requestMarkers.length}
              </strong> mapped locations
            </div>
          </Card>

          <div className="space-y-4 h-full overflow-y-auto">
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase">Control Panel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Visibility Layers</h4>
                  <div
                    className="flex items-center justify-between p-2 rounded bg-secondary/20 border cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => toggleLayer('coreData')}
                  >
                    <span className="text-sm font-medium">Core Data</span>
                    <Badge className={layers.coreData ? "bg-emerald-600" : "bg-gray-400"}>
                      {layers.coreData ? "Active" : "Off"}
                    </Badge>
                  </div>
                  <div
                    className="flex items-center justify-between p-2 rounded bg-secondary/10 border border-dashed cursor-pointer hover:bg-secondary/20 transition-colors"
                    onClick={() => toggleLayer('zoning')}
                  >
                    <span className="text-sm font-medium">Zoning Districts</span>
                    <Badge className={layers.zoning ? "bg-purple-600" : "bg-gray-400 cursor-pointer"}>
                      {layers.zoning ? "Showing" : "Off"}
                    </Badge>
                  </div>
                  <div
                    className="flex items-center justify-between p-2 rounded bg-secondary/10 border border-dashed cursor-pointer hover:bg-secondary/20 transition-colors"
                    onClick={() => toggleLayer('flood')}
                  >
                    <span className="text-sm font-medium">Flood Risks</span>
                    <Badge className={layers.flood ? "bg-blue-600" : "bg-gray-400 cursor-pointer"}>
                      {layers.flood ? "Showing" : "Off"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">

                {activeTab === 'businesses' ? (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-4 flex justify-center">
                      <img src={markerIcon} className="h-full object-contain" alt="Marker" />
                    </div>
                    <span className="font-medium">Registered Entity</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-yellow-500 border border-black/20" />
                      <span>Submitted / Pending</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500 border border-black/20" />
                      <span>Under Processing</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 border border-black/20" />
                      <span>Approved</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-red-500 border border-black/20" />
                      <span>Rejected</span>
                    </div>
                  </>
                )}

              </CardContent>
            </Card>

            <Card className="bg-[#0F0F0F] text-[#F4C400] border-[#F4C400]">
              <CardContent className="p-4 flex items-start gap-3">
                <Navigation className="h-5 w-5 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">Satellite Imagery</h4>
                  <p className="text-xs opacity-90 text-white">
                    High-resolution World Imagery provided by ESRI.
                    Use the layer control (top-right) to switch map modes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </Tabs>
    </MainLayout>
  );
}
