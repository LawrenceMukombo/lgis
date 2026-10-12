import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useOrganization } from "@/contexts/organization-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Lock, Eye, EyeOff, Check, X, Minus, Search } from "lucide-react";

interface FieldPolicy {
    entity: string;
    field: string;
    public: AccessLevel;
    officer: AccessLevel;
    manager: AccessLevel;
    admin: AccessLevel;
    breakGlass: AccessLevel;
}

type AccessLevel = 'full' | 'masked' | 'partial' | 'none';

export function FieldPolicyMatrix() {
    const { toast } = useToast();
    const { currentOrganization } = useOrganization();
    const queryClient = useQueryClient();

    const [selectedEntity, setSelectedEntity] = useState<string>('citizen');
    const [editMode, setEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [localPolicies, setLocalPolicies] = useState<FieldPolicy[]>([]);

    const entities = ['citizen', 'business', 'payment', 'license'];

    // Fetch field policies
    const { data: fetchedPolicies, isLoading } = useQuery({
        queryKey: ["/api/v1/field-policies", currentOrganization?.councilId],
        queryFn: async () => {
            if (!currentOrganization?.councilId) return [];
            const res = await apiRequest("GET", `/api/v1/field-policies`);
            return res.json();
        },
        enabled: !!currentOrganization?.councilId
    });

    // Merge fetched policies with defaults
    useEffect(() => {
        if (!fetchedPolicies) return;
        // In a real app we might merge with a static list of ALL possible fields
        // For now, let's just use what comes back, or default to the sample list if empty (for demo)
        if (fetchedPolicies.length > 0) {
            setLocalPolicies(fetchedPolicies);
        } else {
            // If no policies in DB, maybe seed with defaults or show empty? 
            // Let's stick to the static list as "template" but override with DB values
            setLocalPolicies(defaultPolicies);
        }
    }, [fetchedPolicies]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async (policy: FieldPolicy) => {
            const res = await apiRequest("POST", "/api/v1/field-policies", policy);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/v1/field-policies"] });
        },
        onError: () => {
            toast({
                title: "Failed to save",
                description: "Could not update policy.",
                variant: "destructive",
            });
        }
    });

    const handleSave = async () => {
        // Save all local modified policies
        // Ideally we only save changed ones, but for simplicity we can save the current view/entity
        // checking against original is better optimization.

        let successCount = 0;
        for (const policy of localPolicies) {
            try {
                // Only save if it belongs to current view (or save all)
                // Let's save all in localPolicies
                await saveMutation.mutateAsync(policy);
                successCount++;
            } catch (e) {
                console.error(e);
            }
        }

        if (successCount > 0) {
            toast({
                title: "Policies Saved",
                description: `Successfully updated field policies.`,
            });
            setEditMode(false);
        }
    };

    const handlePolicyChange = (field: string, role: string, level: AccessLevel) => {
        setLocalPolicies(prev => prev.map(p =>
            p.field === field && p.entity === selectedEntity
                ? { ...p, [role]: level }
                : p
        ));
    };

    const filteredPolicies = localPolicies.filter(p =>
        p.entity === selectedEntity &&
        p.field.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getAccessIcon = (level: AccessLevel) => {
        switch (level) {
            case 'full':
                return <Check className="h-4 w-4 text-positive" />;
            case 'masked':
                return <EyeOff className="h-4 w-4 text-warning" />;
            case 'partial':
                return <Minus className="h-4 w-4 text-accent-primary-default" />;
            case 'none':
                return <X className="h-4 w-4 text-negative" />;
            default:
                return <X className="h-4 w-4 text-gray-300" />;
        }
    };

    return (
        <Card className="shadow-xl bg-background-default border-outline-dimmer">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-2xl text-foreground-default">
                            <Shield className="h-6 w-6 text-accent-primary-default" />
                            Field-Level Access Policy Matrix
                        </CardTitle>
                        <CardDescription className="mt-2 text-foreground-dimmer">
                            Granular data access control for sensitive entities
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Switch id="edit-mode-switch" checked={editMode} onCheckedChange={setEditMode} />
                            <Label htmlFor="edit-mode-switch">Edit Mode</Label>
                        </div>
                        <Button variant="outline" size="sm" title="Export Access Matrix">
                            <Shield className="h-4 w-4 mr-2" />
                            Export Matrix
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex gap-2 flex-1">
                        {entities.map(entity => (
                            <Button
                                key={entity}
                                size="sm"
                                variant={selectedEntity === entity ? "default" : "outline"}
                                onClick={() => setSelectedEntity(entity)}
                                className={`capitalize rounded-lg px-4 ${selectedEntity === entity
                                    ? "bg-accent-primary-default text-background-default border-accent-primary-default"
                                    : "text-foreground-dimmer border-outline-dimmer"
                                    }`}
                            >
                                {entity}
                            </Button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-black transition-colors" />
                        <Input
                            placeholder="Search fields..."
                            className="pl-10 h-10 border-outline-dimmer bg-background-higher"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Access Level Legend */}
                <Card className="border shadow-none bg-background-higher border-outline-dimmer">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-6 text-sm">
                            <span className="font-semibold text-foreground-default">Access Levels:</span>
                            <div className="flex items-center gap-2 text-foreground-dimmer">
                                <Check className="h-4 w-4 text-positive" />
                                <span>Full Access</span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground-dimmer">
                                <EyeOff className="h-4 w-4 text-warning" />
                                <span>Masked</span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground-dimmer">
                                <Minus className="h-4 w-4 text-accent-primary-default" />
                                <span>Partial</span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground-dimmer">
                                <X className="h-4 w-4 text-negative" />
                                <span>No Access</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Interactive Matrix Table */}
                <div className="rounded-lg border overflow-hidden border-outline-dimmer">
                    <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-background-higher">
                                <TableRow className="border-outline-dimmer">
                                    <TableHead className="font-bold text-foreground-default">Field Name</TableHead>
                                    <TableHead className="text-center text-foreground-dimmer">
                                        <div className="flex flex-col items-center gap-1">
                                            <Eye className="h-4 w-4" />
                                            <span className="text-xs">Public</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center text-foreground-dimmer">
                                        <div className="flex flex-col items-center gap-1">
                                            <Shield className="h-4 w-4" />
                                            <span className="text-xs">Officer</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center text-foreground-dimmer">
                                        <div className="flex flex-col items-center gap-1">
                                            <Shield className="h-4 w-4" />
                                            <span className="text-xs">Manager</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center text-foreground-dimmer">
                                        <div className="flex flex-col items-center gap-1">
                                            <Shield className="h-4 w-4" />
                                            <span className="text-xs">Admin</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-center text-foreground-dimmer">
                                        <div className="flex flex-col items-center gap-1">
                                            <Lock className="h-4 w-4 text-negative" />
                                            <span className="text-xs">Break-Glass</span>
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">Loading policies...</TableCell>
                                    </TableRow>
                                ) : filteredPolicies.map((policy) => (
                                    <TableRow
                                        key={`${policy.entity}-${policy.field}`}
                                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                                        style={{ borderColor: 'var(--outline-dimmer)' }}
                                    >
                                        <TableCell className="font-mono text-sm font-semibold" style={{ color: 'var(--foreground-default)' }}>
                                            {policy.field}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {editMode ? (
                                                <AccessLevelSelector value={policy.public} onChange={(v) => handlePolicyChange(policy.field, 'public', v)} />
                                            ) : (
                                                <div className="flex justify-center">
                                                    {getAccessIcon(policy.public)}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {editMode ? (
                                                <AccessLevelSelector value={policy.officer} onChange={(v) => handlePolicyChange(policy.field, 'officer', v)} />
                                            ) : (
                                                <div className="flex justify-center">
                                                    {getAccessIcon(policy.officer)}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {editMode ? (
                                                <AccessLevelSelector value={policy.manager} onChange={(v) => handlePolicyChange(policy.field, 'manager', v)} />
                                            ) : (
                                                <div className="flex justify-center">
                                                    {getAccessIcon(policy.manager)}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {editMode ? (
                                                <AccessLevelSelector value={policy.admin} onChange={(v) => handlePolicyChange(policy.field, 'admin', v)} />
                                            ) : (
                                                <div className="flex justify-center">
                                                    {getAccessIcon(policy.admin)}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                {editMode ? (
                                                    <AccessLevelSelector value={policy.breakGlass} onChange={(v) => handlePolicyChange(policy.field, 'breakGlass', v)} />
                                                ) : (
                                                    <div className="flex justify-center">
                                                        {getAccessIcon(policy.breakGlass)}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>

                {editMode && (
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditMode(false)} className="text-foreground-default border-outline-dimmer">
                            Cancel
                        </Button>
                        <Button className="btn-primary" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Default Data for seeding/fallback
const defaultPolicies: FieldPolicy[] = [
    {
        entity: 'citizen',
        field: 'citizenId',
        public: 'full',
        officer: 'full',
        manager: 'full',
        admin: 'full',
        breakGlass: 'full'
    },
    {
        entity: 'citizen',
        field: 'firstName',
        public: 'full',
        officer: 'full',
        manager: 'full',
        admin: 'full',
        breakGlass: 'full'
    },
    {
        entity: 'citizen',
        field: 'lastName',
        public: 'full',
        officer: 'full',
        manager: 'full',
        admin: 'full',
        breakGlass: 'full'
    },
    {
        entity: 'citizen',
        field: 'nationalId',
        public: 'none',
        officer: 'masked',
        manager: 'full',
        admin: 'full',
        breakGlass: 'full'
    },
    {
        entity: 'citizen',
        field: 'dob',
        public: 'none',
        officer: 'none',
        manager: 'full',
        admin: 'full',
        breakGlass: 'full'
    },
    {
        entity: 'citizen',
        field: 'phone',
        public: 'none',
        officer: 'full',
        manager: 'full',
        admin: 'full',
        breakGlass: 'full'
    },
    {
        entity: 'citizen',
        field: 'email',
        public: 'none',
        officer: 'full',
        manager: 'full',
        admin: 'full',
        breakGlass: 'full'
    },
    {
        entity: 'citizen',
        field: 'address',
        public: 'partial',
        officer: 'full',
        manager: 'full',
        admin: 'full',
        breakGlass: 'full'
    },
    {
        entity: 'citizen',
        field: 'bankDetails',
        public: 'none',
        officer: 'none',
        manager: 'none',
        admin: 'masked',
        breakGlass: 'full'
    },
];

function AccessLevelSelector({ value, onChange }: { value: AccessLevel; onChange: (val: AccessLevel) => void }) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-28">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="masked">Masked</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="none">None</SelectItem>
            </SelectContent>
        </Select>
    );
}
