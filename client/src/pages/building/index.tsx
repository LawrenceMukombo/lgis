import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, HardHat, ClipboardCheck, AlertTriangle, Hammer, Search, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BuildingControlPage() {
    const permitStats = [
        { month: 'Aug', issued: 45 },
        { month: 'Sep', issued: 52 },
        { month: 'Oct', issued: 48 },
        { month: 'Nov', issued: 61 },
        { month: 'Dec', issued: 55 },
        { month: 'Jan', issued: 30 },
    ];

    const projects = [
        { id: "BP-2026-001", project: "Woodlands Heights Residential Complex", location: "Woodlands", type: "Residential", status: "Construction", progress: 65 },
        { id: "BP-2026-002", project: "Civic Centre Administrative Annex", location: "Independence Ave", type: "Commercial", status: "Inspection", progress: 90 },
        { id: "BP-2026-003", project: "Soweto Market Cold Storage Upgrade", location: "Lumumba Rd", type: "Public", status: "Planning", progress: 15 },
        { id: "BP-2026-004", project: "Nampundwe Logistics Warehouse 4B", location: "Heavy Industrial", type: "Industrial", status: "Pending", progress: 0 },
    ];

    return (
        <MainLayout>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 p-6 rounded-2xl shadow-lg mb-8 border border-gray-100" style={{ backgroundColor: '#FFFFFF', color: '#0F0F0F' }}>
                <div>
                    <h2 className="text-3xl font-black tracking-tight uppercase" style={{ color: '#F4C400' }}>Building Control</h2>
                    <p className="font-medium" style={{ color: '#0F0F0F', opacity: 0.8 }}>Regulation of construction, permits, and safety standards.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-2 font-bold hover:bg-black/90" style={{ backgroundColor: '#0F0F0F', color: '#F4C400', borderColor: '#F4C400' }}>
                        <ClipboardCheck className="mr-2 h-4 w-4" style={{ color: '#F4C400' }} />
                        Schedule Inspection
                    </Button>
                    <Button className="font-bold border-none shadow-md hover:bg-black/90" style={{ backgroundColor: '#0F0F0F', color: '#F4C400' }}>
                        <Hammer className="mr-2 h-4 w-4" style={{ color: '#F4C400' }} />
                        Approve Permit
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card className="shadow-sm bg-white border border-gray-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-black uppercase">Active Permits</p>
                            <FileText className="h-4 w-4 text-[#F4C400]" />
                        </div>
                        <div className="text-2xl font-black text-[#F4C400]">214</div>
                        <p className="text-xs text-black font-medium mt-1">Currently valid</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm bg-white border border-gray-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-black uppercase">Inspections</p>
                            <HardHat className="h-4 w-4 text-[#F4C400]" />
                        </div>
                        <div className="text-2xl font-black text-[#F4C400]">42</div>
                        <p className="text-xs text-black font-medium mt-1">Scheduled this week</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm bg-white border border-gray-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-black uppercase">Compliance</p>
                            <ClipboardCheck className="h-4 w-4 text-[#F4C400]" />
                        </div>
                        <div className="text-2xl font-black text-[#F4C400]">94%</div>
                        <p className="text-xs text-black font-medium mt-1">Pass rate</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm bg-white border border-gray-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-black uppercase">Violations</p>
                            <AlertTriangle className="h-4 w-4 text-[#F4C400]" />
                        </div>
                        <div className="text-2xl font-black text-[#F4C400]">8</div>
                        <p className="text-xs text-black font-medium mt-1">Open cases</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="col-span-2 shadow-sm bg-white border border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-[#F4C400]">Major Projects</CardTitle>
                        <CardDescription className="text-black/70 font-medium">Ongoing large-scale developments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-bold text-black">Project ID</TableHead>
                                    <TableHead className="font-bold text-black">Name</TableHead>
                                    <TableHead className="font-bold text-black">Type</TableHead>
                                    <TableHead className="font-bold text-black">Status</TableHead>
                                    <TableHead className="font-bold text-black">Progress</TableHead>
                                    <TableHead className="text-right font-bold text-black">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-mono text-xs">{p.id}</TableCell>
                                        <TableCell>
                                            <div className="font-bold text-sm text-black">{p.project}</div>
                                            <div className="text-xs text-gray-500">{p.location}</div>
                                        </TableCell>
                                        <TableCell>{p.type}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">
                                                {p.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#F4C400]" style={{ width: `${p.progress}%` }} />
                                                </div>
                                                <span className="text-xs font-mono">{p.progress}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <Search className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="shadow-sm bg-white border border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-[#F4C400]">Permits Issued</CardTitle>
                        <CardDescription className="text-black/70 font-medium">6-month trend.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={permitStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        itemStyle={{ color: "#F4C400" }}
                                        contentStyle={{ borderRadius: "8px" }}
                                    />
                                    <Bar dataKey="issued" fill="#0F0F0F" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-bold text-sm text-black mb-1">Fee Collection</h4>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-black text-[#F4C400]">K245k</span>
                                <span className="text-xs text-gray-500 mb-1">YTD Revenue</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}

// Icon wrapper for building icon used in stats (FileText was used, maybe switch to generic)
function FileText(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
    );
}
