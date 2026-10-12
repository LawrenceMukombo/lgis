import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Lock } from "lucide-react";

import { useOrganization } from "@/contexts/organization-context";
import { Building2 } from "lucide-react";

export default function VerificationPage() {
    const [match, params] = useRoute("/verify/:licenceNo");
    const licenceNo = params?.licenceNo;
    const { currentOrganization } = useOrganization();

    const { data, isLoading, error } = useQuery<any>({
        queryKey: [`/api/v1/verify/${licenceNo}`],
        enabled: !!licenceNo,
        retry: false
    });

    const councilName = data?.councilName || currentOrganization?.name || "Local Government Council";

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const isValid = data?.valid;
    const status = data?.status;
    const licence = data?.licence;
    const isSigned = data?.cryptographicallySigned;
    const integrityVerified = data?.integrityVerified;

    return (
        <div className="min-h-screen bg-[#F0F1F2] flex items-center justify-center p-4 selection:bg-yellow-200">
            <Card className="w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none rounded-3xl overflow-hidden bg-white">
                <div className="h-3 bg-[#F4C400]" />
                <CardHeader className="text-center pb-2 pt-10">
                    <div className="mx-auto mb-6 h-20 w-20 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center text-yellow-600 transform hover:scale-105 transition-transform duration-300">
                        <Building2 className="h-10 w-10" />
                    </div>
                    <CardTitle className="text-3xl font-black text-[#0F0F0F] tracking-tighter uppercase">License Verification</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F0F0F]/60">{councilName}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-8 px-10 pb-12 pt-6">
                    {error || !data ? (
                        <div className="flex flex-col items-center text-center space-y-4 p-10 bg-red-50 rounded-3xl text-red-700 border border-red-100">
                            <XCircle className="h-16 w-16 text-red-600" />
                            <h3 className="font-black text-2xl tracking-tight uppercase">Invalid License</h3>
                            <p className="text-sm font-medium opacity-80">This license number could not be found in our records or has been revoked.</p>
                            <p className="font-mono text-xs bg-red-100 px-4 py-2 rounded-full mt-4 font-bold">{licenceNo}</p>
                        </div>
                    ) : (
                        <>
                            <div className={`flex flex-col items-center text-center space-y-4 p-10 rounded-[2.5rem] relative overflow-hidden shadow-sm transition-all duration-500 ${isValid ? 'bg-[#F4C400]/10 text-black border border-[#F4C400]/20' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {/* Background Accent */}
                                <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 ${isValid ? 'bg-[#F4C400]' : 'bg-red-400'}`} />

                                {isValid ? (
                                    <CheckCircle2 className="h-16 w-16 text-[#F4C400] relative z-10" />
                                ) : (
                                    <XCircle className="h-16 w-16 text-red-600 relative z-10" />
                                )}

                                <div className="space-y-1 relative z-10">
                                    <h3 className="font-black text-3xl tracking-tighter uppercase">{isValid ? "Valid License" : "Inactive License"}</h3>
                                    <Badge variant={isValid ? "default" : "destructive"} className={`font-black uppercase text-[10px] tracking-widest px-4 py-1.5 ${isValid ? 'bg-black text-[#F4C400]' : ''}`}>
                                        {status === 'active' ? 'ACTIVE' : status?.toUpperCase()}
                                    </Badge>
                                </div>

                                <p className="text-sm font-bold opacity-70 relative z-10 max-w-[240px]">
                                    {isValid
                                        ? "This license is officially registered and cleared for operation."
                                        : "This license has expired or been revoked and is no longer valid."}
                                </p>
                            </div>

                            {/* Verification Data */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-3 mb-2 px-2">
                                    <div className="h-[1px] flex-1 bg-slate-100" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Certificate Identity</span>
                                    <div className="h-[1px] flex-1 bg-slate-100" />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-slate-50 p-5 rounded-2xl flex items-center justify-between group hover:bg-slate-100 transition-colors">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">License Number</p>
                                            <p className="font-mono text-lg font-black text-slate-900 tracking-tight">{licence.licenceNo}</p>
                                        </div>
                                        <Lock className="h-5 w-5 text-slate-200 group-hover:text-slate-400 transition-colors" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-5 rounded-2xl space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issued Date</p>
                                            <p className="text-sm font-black text-slate-800">{licence.issueDate}</p>
                                        </div>
                                        <div className="bg-slate-50 p-5 rounded-2xl space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry Date</p>
                                            <p className="text-sm font-black text-slate-800">{licence.expiryDate}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cryptographic Seal Component */}
                            <div className={`p-6 rounded-2xl border-2 flex items-center gap-5 transition-all duration-500 ${integrityVerified ? 'border-[#F4C400]/20 bg-[#F4C400]/5' : 'border-red-100 bg-red-50'}`}>
                                <div className={`p-3 rounded-xl ${integrityVerified ? 'bg-[#F4C400]' : 'bg-red-500'}`}>
                                    {integrityVerified ? <ShieldCheck className="h-6 w-6 text-black" /> : <ShieldAlert className="h-6 w-6 text-white" />}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cryptographic Status</p>
                                    <p className={`text-xs font-black uppercase ${integrityVerified ? 'text-black' : 'text-red-600'}`}>
                                        {integrityVerified ? "Integrity Verified • PAdES Sealed" : "Certificate Tamper Detected"}
                                    </p>
                                    <p className="text-[10px] font-medium text-slate-500 italic">
                                        {integrityVerified
                                            ? "This certificate matches the immutable government record."
                                            : "The digital file has been modified or corrupted."}
                                    </p>
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Official Digital Record • National Capital District
                                </p>
                                <p className="text-[8px] text-slate-300 font-mono">{licence.licenceId}</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
