import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, FileText, Upload, Search, MoreVertical, File, Image as ImageIcon, FileArchive, Clock } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DocumentsPage() {
    const [currentFolder, setCurrentFolder] = useState("Root");
    const [view, setView] = useState("grid");

    const folders = [
        { id: 1, name: "Policies & Procedures", count: 12 },
        { id: 2, name: "Licensing Forms", count: 45 },
        { id: 3, name: "Planning Maps", count: 8 },
        { id: 4, name: "Meeting Minutes", count: 24 },
    ];

    const files = [
        { id: 1, name: "Lusaka_City_Council_Bylaws_2026.pdf", type: "pdf", size: "4.2 MB", date: "Jan 10, 2026", owner: "Legal & Registry" },
        { id: 2, name: "Trading_License_Application_Form.docx", type: "doc", size: "125 KB", date: "Jan 12, 2026", owner: "Licensing" },
        { id: 3, name: "Lusaka_Master_Plan_Zoning.dwg", type: "cad", size: "12.5 MB", date: "Jan 15, 2026", owner: "Planning" },
        { id: 4, name: "Council_Staff_Handbook_2026.pdf", type: "pdf", size: "2.1 MB", date: "Jan 05, 2026", owner: "Human Resources" },
        { id: 5, name: "Municipal_Budget_Forecast_2026.xlsx", type: "xls", size: "890 KB", date: "Jan 20, 2026", owner: "Finance" },
    ];

    const getIcon = (type: string) => {
        if (type === 'pdf') return <FileText className="h-8 w-8 text-red-500" />;
        if (type === 'doc') return <FileText className="h-8 w-8 text-blue-500" />;
        if (type === 'xls') return <FileText className="h-8 w-8 text-green-500" />;
        if (type === 'cad') return <ImageIcon className="h-8 w-8 text-yellow-600" />;
        return <File className="h-8 w-8 text-gray-400" />;
    };

    return (
        <MainLayout>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 p-6 rounded-2xl shadow-lg mb-8 border border-gray-100" style={{ backgroundColor: '#FFFFFF', color: '#0F0F0F' }}>
                <div>
                    <h2 className="text-3xl font-black tracking-tight uppercase" style={{ color: '#F4C400' }}>Document Management</h2>
                    <p className="font-medium" style={{ color: '#0F0F0F', opacity: 0.8 }}>Secure storage and access control for city records.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-2 font-bold hover:bg-black/90" style={{ backgroundColor: '#0F0F0F', color: '#F4C400', borderColor: '#F4C400' }}>
                        <Folder className="mr-2 h-4 w-4" style={{ color: '#F4C400' }} />
                        New Folder
                    </Button>
                    <Button className="font-bold border-none shadow-md hover:bg-black/90" style={{ backgroundColor: '#0F0F0F', color: '#F4C400' }}>
                        <Upload className="mr-2 h-4 w-4" style={{ color: '#F4C400' }} />
                        Upload File
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4 h-[calc(100vh-250px)]">
                {/* Sidebar Nav */}
                <Card className="col-span-1 shadow-sm bg-white border border-gray-100 h-full overflow-hidden flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase text-black">Folders</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        <div className="space-y-1">
                            <Button variant="ghost" className="w-full justify-start font-medium bg-gray-100 text-black">
                                <Folder className="mr-2 h-4 w-4 fill-[#F4C400] text-[#F4C400]" /> Root
                            </Button>
                            {folders.map(f => (
                                <Button key={f.id} variant="ghost" className="w-full justify-between font-normal text-gray-600 hover:text-black">
                                    <div className="flex items-center">
                                        <Folder className="mr-2 h-4 w-4 text-gray-400" /> {f.name}
                                    </div>
                                    <span className="text-xs text-gray-400">{f.count}</span>
                                </Button>
                            ))}
                        </div>
                        <div className="mt-8">
                            <h4 className="text-xs font-bold uppercase text-black mb-2 px-2">Storage Usage</h4>
                            <div className="px-2">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Used</span>
                                    <span className="font-bold">45%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#F4C400]" style={{ width: '45%' }} />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">450GB of 1TB used</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <Card className="col-span-3 shadow-sm bg-white border border-gray-100 h-full flex flex-col">
                    <CardHeader className="border-b border-gray-100 py-4 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="hover:text-black cursor-pointer">Documents</span>
                            <span>/</span>
                            <span className="font-bold text-black">{currentFolder}</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <Input placeholder="Search files..." className="pl-9 w-[250px] bg-gray-50 border-gray-200" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-6 overflow-y-auto">
                        <h3 className="text-sm font-bold uppercase text-black mb-4">Files</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {files.map(file => (
                                <div key={file.id} className="group relative p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all cursor-pointer hover:shadow-sm hover:border-[#F4C400]/50">
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><MoreVertical className="h-3 w-3" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem>Download</DropdownMenuItem>
                                                <DropdownMenuItem>Share</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex flex-col items-center text-center space-y-3 pt-2">
                                        {getIcon(file.type)}
                                        <div className="w-full">
                                            <h4 className="font-medium text-sm text-black truncate w-full" title={file.name}>{file.name}</h4>
                                            <p className="text-xs text-gray-400 mt-1">{file.size} • {file.date}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Upload Placeholder */}
                            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#F4C400] hover:bg-[#F4C400]/5 transition-colors cursor-pointer text-gray-400 hover:text-[#F4C400]">
                                <Upload className="h-8 w-8 mb-2" />
                                <span className="text-sm font-bold">Upload New</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
