import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldPolicyMatrix } from "@/components/security/FieldPolicyMatrix";
import { BreakGlassWorkflow } from "@/components/security/BreakGlassWorkflow";
import { LicenseRequirementsTab } from "@/components/admin/LicenseRequirementsTab";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { AuditLogsViewer } from "@/components/admin/AuditLogsViewer";
import {
    Shield,
    Key,
    Database,
    AlertTriangle,
    Search,
    Filter,
    Lock,
    Unlock,
    Eye,
    EyeOff,
    CheckCircle2,
    XCircle,
    Clock,
    Download,
    Upload,
    Sparkles,
    Zap,
    Activity,
    ClipboardList
} from "lucide-react";

export default function ConfigurationPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedModule, setSelectedModule] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-background-root">
            {/* Standard Theme Header */}
            <div className="bg-background-highest p-8 border-b-4 border-black/5">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-black text-foreground uppercase tracking-tight">System Configuration</h1>
                            <p className="text-foreground/80 font-medium text-lg mt-2">Manage organization profile, users, security & permissions.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button className="font-bold border-none shadow-md" style={{ backgroundColor: '#0F0F0F', color: '#F4C400' }}>
                                <Download className="mr-2 h-4 w-4" style={{ color: '#F4C400' }} />
                                Export Config
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                <Tabs defaultValue="permissions" className="space-y-8">
                    {/* Standard Button Tabs */}
                    <TabsList className="flex flex-wrap gap-3 bg-transparent h-auto p-0 justify-start w-full">
                        <TabsTrigger
                            value="permissions"
                            className="h-12 px-6 border-2 border-foreground/10 data-[state=active]:bg-[#0F0F0F] data-[state=active]:text-[#F4C400] data-[state=active]:border-[#0F0F0F] bg-[#FEF7E0] text-foreground font-bold uppercase tracking-widest transition-all rounded-lg shadow-sm hover:translate-y-[-1px] hover:shadow-md"
                        >
                            Permissions
                        </TabsTrigger>
                        <TabsTrigger
                            value="roles"
                            className="h-12 px-6 border-2 border-foreground/10 data-[state=active]:bg-[#0F0F0F] data-[state=active]:text-[#F4C400] data-[state=active]:border-[#0F0F0F] bg-[#FEF7E0] text-foreground font-bold uppercase tracking-widest transition-all rounded-lg shadow-sm hover:translate-y-[-1px] hover:shadow-md"
                        >
                            Roles
                        </TabsTrigger>
                        <TabsTrigger
                            value="field-policies"
                            className="h-12 px-6 border-2 border-foreground/10 data-[state=active]:bg-[#0F0F0F] data-[state=active]:text-[#F4C400] data-[state=active]:border-[#0F0F0F] bg-[#FEF7E0] text-foreground font-bold uppercase tracking-widest transition-all rounded-lg shadow-sm hover:translate-y-[-1px] hover:shadow-md"
                        >
                            Field Policies
                        </TabsTrigger>
                        <TabsTrigger
                            value="break-glass"
                            className="h-12 px-6 border-2 border-foreground/10 data-[state=active]:bg-[#0F0F0F] data-[state=active]:text-[#F4C400] data-[state=active]:border-[#0F0F0F] bg-[#FEF7E0] text-foreground font-bold uppercase tracking-widest transition-all rounded-lg shadow-sm hover:translate-y-[-1px] hover:shadow-md"
                        >
                            Break-Glass
                        </TabsTrigger>
                        <TabsTrigger
                            value="audit"
                            className="h-12 px-6 border-2 border-foreground/10 data-[state=active]:bg-[#0F0F0F] data-[state=active]:text-[#F4C400] data-[state=active]:border-[#0F0F0F] bg-[#FEF7E0] text-foreground font-bold uppercase tracking-widest transition-all rounded-lg shadow-sm hover:translate-y-[-1px] hover:shadow-md"
                        >
                            Audit Logs
                        </TabsTrigger>
                        <TabsTrigger
                            value="licensing"
                            className="h-12 px-6 border-2 border-foreground/10 data-[state=active]:bg-[#0F0F0F] data-[state=active]:text-[#F4C400] data-[state=active]:border-[#0F0F0F] bg-[#FEF7E0] text-foreground font-bold uppercase tracking-widest transition-all rounded-lg shadow-sm hover:translate-y-[-1px] hover:shadow-md"
                        >
                            License Requirements
                        </TabsTrigger>
                    </TabsList>

                    {/* PERMISSIONS TAB */}
                    <TabsContent value="permissions" className="space-y-6">
                        <PermissionsManager searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                    </TabsContent>

                    {/* ROLES TAB */}
                    <TabsContent value="roles">
                        <RolesManager searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                    </TabsContent>

                    {/* FIELD POLICIES TAB */}
                    <TabsContent value="field-policies">
                        <FieldPoliciesManager />
                    </TabsContent>

                    {/* BREAK-GLASS TAB */}
                    <TabsContent value="break-glass">
                        <BreakGlassManager />
                    </TabsContent>

                    {/* AUDIT TAB */}
                    <TabsContent value="audit">
                        <AuditLogsViewer />
                    </TabsContent>

                    {/* LICENSING TAB */}
                    <TabsContent value="licensing">
                        <LicenseRequirementsTab />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

// ================================
// PERMISSIONS MANAGER COMPONENT
// ================================
function PermissionsManager({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) {
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [showOnlyCritical, setShowOnlyCritical] = useState(false);

    // Mock data - will be replaced with actual API
    const permissions = [
        { code: 'citizen:read', module: 'Registry', description: 'View citizen records', riskLevel: 'low', requiresMFA: false },
        { code: 'citizen:write', module: 'Registry', description: 'Create/update citizen records', riskLevel: 'medium', requiresMFA: false },
        { code: 'citizen:delete', module: 'Registry', description: 'Delete citizen records', riskLevel: 'critical', requiresMFA: true },
        { code: 'payment:refund', module: 'Financial', description: 'Process refunds', riskLevel: 'critical', requiresMFA: true },
        { code: 'licence:revoke', module: 'Licensing', description: 'Revoke licences', riskLevel: 'critical', requiresMFA: true },
    ];

    const modules = ['Registry', 'Licensing', 'Financial', 'Enforcement', 'Services', 'Administration', 'Reporting', 'GIS', 'Security'];

    const filteredPermissions = permissions.filter(p => {
        const matchesSearch = p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesModule = !selectedModule || p.module === selectedModule;
        const matchesCritical = !showOnlyCritical || p.riskLevel === 'critical';
        return matchesSearch && matchesModule && matchesCritical;
    });

    const getRiskBadge = (level: string) => {
        const variants = {
            low: 'bg-green-100 text-green-700 border-green-200',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            high: 'bg-orange-100 text-orange-700 border-orange-200',
            critical: 'bg-red-100 text-red-700 border-red-200 animate-pulse'
        };
        return variants[level as keyof typeof variants] || variants.low;
    };

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        Permission Catalogue
                    </CardTitle>
                    <CardDescription>78 granular permissions across 9 modules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search permissions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={showOnlyCritical}
                                onCheckedChange={setShowOnlyCritical}
                            />
                            <Label>Critical Only</Label>
                        </div>
                    </div>

                    {/* Module Filter Pills */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant={!selectedModule ? "default" : "outline"}
                            onClick={() => setSelectedModule(null)}
                            className="rounded-full"
                        >
                            All Modules
                        </Button>
                        {modules.map(module => (
                            <Button
                                key={module}
                                size="sm"
                                variant={selectedModule === module ? "default" : "outline"}
                                onClick={() => setSelectedModule(module)}
                                className="rounded-full"
                            >
                                {module}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Permissions Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPermissions.map((permission) => (
                    <Card key={permission.code} className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 hover:border-l-purple-500">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-sm font-mono text-blue-600">{permission.code}</CardTitle>
                                    <CardDescription className="mt-2">{permission.description}</CardDescription>
                                </div>
                                {permission.requiresMFA && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                        <Lock className="h-3 w-3 mr-1" />
                                        MFA
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Badge className={getRiskBadge(permission.riskLevel)}>
                                    {permission.riskLevel.toUpperCase()}
                                </Badge>
                                <Badge variant="outline">{permission.module}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// ================================
// ROLES MANAGER COMPONENT
// ================================
function RolesManager({ searchQuery, setSearchQuery }: { searchQuery: string, setSearchQuery: (q: string) => void }) {
    const [scopeFilter, setScopeFilter] = useState("all");

    return (
        <div className="space-y-6">
            <Card className="shadow-lg border-none bg-background-highest">
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-black transition-colors" />
                            <Input
                                placeholder="Filter roles and scopes..."
                                className="pl-10 h-11 border-outline-dimmer bg-background-higher"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-[200px]">
                            <Select value={scopeFilter} onValueChange={setScopeFilter}>
                                <SelectTrigger className="h-11 border-outline-dimmer bg-background-higher">
                                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="All Scopes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Scopes</SelectItem>
                                    <SelectItem value="council">Council</SelectItem>
                                    <SelectItem value="unit">Unit</SelectItem>
                                    <SelectItem value="ward">Ward</SelectItem>
                                    <SelectItem value="location">Location</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
            </Card>
            <RoleManagement searchQuery={searchQuery} scopeFilter={scopeFilter} />
        </div>
    );
}

// ================================
// FIELD POLICIES MANAGER
// ================================
function FieldPoliciesManager() {
    return <FieldPolicyMatrix />;
}

// ================================
// BREAK-GLASS MANAGER
// ================================
function BreakGlassManager() {
    return <BreakGlassWorkflow />;
}

// AUDIT LOGS VIEWER handled by separate component
