import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck, Building2 } from "lucide-react";
import { useOrganization } from "@/contexts/organization-context";

export default function VerificationSearchPage() {
    const [licenceNo, setLicenceNo] = useState("");
    const [, setLocation] = useLocation();
    const { currentOrganization } = useOrganization();
    const councilName = currentOrganization?.name || "Lusaka City Council";

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (licenceNo.trim()) {
            setLocation(`/verify/${licenceNo.trim()}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F1F2] flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none rounded-3xl overflow-hidden bg-white">
                <div className="h-3 bg-[#F4C400]" />
                <CardHeader className="text-center pb-2 pt-10">
                    <div className="mx-auto mb-6 h-20 w-20 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center text-yellow-600 transform hover:scale-105 transition-transform duration-300">
                        <Building2 className="h-10 w-10" />
                    </div>
                    <CardTitle className="text-3xl font-black text-[#0F0F0F] tracking-tighter uppercase">Verify License</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-[0.2em] text-[#0F0F0F]/60">
                        {councilName}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8 px-10 pb-12 pt-6">
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="Enter License Number (e.g. TL-2026-001)"
                                    className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-200 focus:border-[#F4C400] text-lg font-mono focus:ring-[#F4C400]/20"
                                    value={licenceNo}
                                    onChange={(e) => setLicenceNo(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-bold bg-black hover:bg-gray-900 text-[#F4C400] rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={!licenceNo.trim()}
                        >
                            Verify Status
                        </Button>
                    </form>

                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                        <div className="h-10 w-10 shrink-0 bg-[#F4C400]/10 rounded-full flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-[#F4C400]" />
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            This tool provides real-time verification of business licenses issued by {councilName}.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
