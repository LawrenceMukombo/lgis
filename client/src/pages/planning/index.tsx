import { useState } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Map, MapPin, ClipboardList, CheckSquare, Search, Layers, FileText, CalendarDays, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PlanningPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [isNewAppOpen, setIsNewAppOpen] = useState(false);

    const applicationStats = [
        { month: 'Aug', applications: 12 },
        { month: 'Sep', applications: 18 },
        { month: 'Oct', applications: 15 },
        { month: 'Nov', applications: 22 },
        { month: 'Dec', applications: 10 },
        { month: 'Jan', applications: 8 },
    ];

    const applications = [
        { id: "PA-2026-001", project: "Trade Kings Industrial Expansion", location: "Heavy Industrial Area", type: "Industrial Development", status: "Approved", applicant: "Trade Kings Limited" },
        { id: "PA-2026-002", project: "Woodlands Mixed-Use Plaza", location: "Woodlands", type: "Commercial Zoning", status: "Under Review", applicant: "Lusaka Commercial Estates" },
        { id: "PA-2026-003", project: "Rhodes Park Subdivision Lot 14", location: "Rhodes Park", type: "Subdivision", status: "Approved", applicant: "Kondwani Phiri" },
        { id: "PA-2026-004", project: "Matero Community Green Park", location: "Matero", type: "Public Land Use", status: "Pending", applicant: "Lusaka City Council" },
    ];

    return (
        <MainLayout>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 p-6 rounded-2xl shadow-lg mb-8 border border-gray-100" style={{ backgroundColor: '#FFFFFF', color: '#0F0F0F' }}>
                <div>
                    <h2 className="text-3xl font-black tracking-tight uppercase" style={{ color: '#F4C400' }}>Town Planning</h2>
                    <p className="font-medium" style={{ color: '#0F0F0F', opacity: 0.8 }}>Urban planning, zoning, and land use management.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="border-2 font-bold hover:bg-black/90"
                        style={{ backgroundColor: '#0F0F0F', color: '#F4C400', borderColor: '#F4C400' }}
                        onClick={() => setLocation("/gis")}
                    >
                        <Map className="mr-2 h-4 w-4" style={{ color: '#F4C400' }} />
                        View Zoning Map
                    </Button>
                    <Dialog open={isNewAppOpen} onOpenChange={setIsNewAppOpen}>
                        <DialogTrigger asChild>
                            <Button className="font-bold border-none shadow-md hover:bg-black/90" style={{ backgroundColor: '#0F0F0F', color: '#F4C400' }}>
                                <ClipboardList className="mr-2 h-4 w-4" style={{ color: '#F4C400' }} />
                                New Application
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>New Development Application</DialogTitle>
                                <DialogDescription>
                                    Submit a new town planning application.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel htmlFor="name" className="text-right">Project Name</FormLabel>
                                    <Input id="name" placeholder="E.g. City Plaza" className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel htmlFor="typ" className="text-right">Type</FormLabel>
                                    <Select>
                                        <SelectTrigger className="w-[180px] col-span-3 w-full">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="rezoning">Rezoning</SelectItem>
                                            <SelectItem value="subdivision">Subdivision</SelectItem>
                                            <SelectItem value="development">Development</SelectItem>
                                            <SelectItem value="landUse">Land Use</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel htmlFor="location" className="text-right">Location</FormLabel>
                                    <Input id="location" placeholder="Lot, Section, Suburb" className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="bg-[#0F0F0F] text-[#F4C400]" onClick={() => {
                                    toast({ title: "Application Submitted", description: "Your application has been received." });
                                    setIsNewAppOpen(false);
                                }}>Submit Application</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card className="shadow-sm bg-white border border-gray-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-black uppercase">Pending Applications</p>
                            <FileText className="h-4 w-4 text-[#F4C400]" />
                        </div>
                        <div className="text-2xl font-black text-[#F4C400]">34</div>
                        <p className="text-xs text-black font-medium mt-1">Awaiting review</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm bg-white border border-gray-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-black uppercase">Approved YTD</p>
                            <CheckSquare className="h-4 w-4 text-[#F4C400]" />
                        </div>
                        <div className="text-2xl font-black text-[#F4C400]">128</div>
                        <p className="text-xs text-black font-medium mt-1">Development permits</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm bg-white border border-gray-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-black uppercase">Zoning Cases</p>
                            <Layers className="h-4 w-4 text-[#F4C400]" />
                        </div>
                        <div className="text-2xl font-black text-[#F4C400]">12</div>
                        <p className="text-xs text-black font-medium mt-1">Active requests</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm bg-white border border-gray-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-black uppercase">Hearings</p>
                            <CalendarDays className="h-4 w-4 text-[#F4C400]" />
                        </div>
                        <div className="text-2xl font-black text-[#F4C400]">3</div>
                        <p className="text-xs text-black font-medium mt-1">Scheduled next week</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="col-span-2 shadow-sm bg-white border border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-[#F4C400]">Recent Development Applications</CardTitle>
                        <CardDescription className="text-black/70 font-medium">Overview of recent submissions and their status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-bold text-black">App ID</TableHead>
                                    <TableHead className="font-bold text-black">Project & Location</TableHead>
                                    <TableHead className="font-bold text-black">Type</TableHead>
                                    <TableHead className="font-bold text-black">Applicant</TableHead>
                                    <TableHead className="font-bold text-black">Status</TableHead>
                                    <TableHead className="text-right font-bold text-black">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-mono text-xs">{p.id}</TableCell>
                                        <TableCell>
                                            <div className="font-bold text-sm text-black">{p.project}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {p.location}
                                            </div>
                                        </TableCell>
                                        <TableCell>{p.type}</TableCell>
                                        <TableCell className="text-sm text-gray-600">{p.applicant}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`border-gray-200 ${p.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                p.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-gray-50 text-gray-700'
                                                }`}>
                                                {p.status}
                                            </Badge>
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
                        <CardTitle className="text-[#F4C400]">Applications</CardTitle>
                        <CardDescription className="text-black/70 font-medium">Monthly submission trend.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={applicationStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        itemStyle={{ color: "#F4C400" }}
                                        contentStyle={{ borderRadius: "8px" }}
                                    />
                                    <Bar dataKey="applications" fill="#0F0F0F" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-bold text-sm text-black mb-1">Fee Collection</h4>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-black text-[#F4C400]">K85k</span>
                                <span className="text-xs text-gray-500 mb-1">YTD Planning Fees</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
