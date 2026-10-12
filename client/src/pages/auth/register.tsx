import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useOrganization } from "@/contexts/organization-context";
import { Loader2, Building2 } from "lucide-react";

export default function RegisterPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { currentOrganization } = useOrganization();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        _honey: "" // anti-spam honeypot
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast({
                title: "Passwords do not match",
                variant: "destructive",
            });
            return;
        }

        if (!currentOrganization) {
            toast({
                title: "System Error",
                description: "Could not determine council context.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            await apiRequest("POST", "/api/register", {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                councilId: currentOrganization.councilId,
                _honey: formData._honey
            });

            toast({
                title: "Registration Successful",
                description: "Please sign in with your new account.",
            });

            setLocation("/");
        } catch (error: any) {
            toast({
                title: "Registration Failed",
                description: error.message || "Something went wrong.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const councilName = currentOrganization?.name || "Lusaka City Council";

    return (
        <div className="flex min-h-screen w-full flex-col md:flex-row">
            {/* Left Panel - Zambian Government Branding */}
            <div className="hidden md:flex w-1/2 bg-[#0B0F17] flex-col justify-between p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F17] via-[#0F172A] to-[#1E293B] opacity-95"></div>
                <div className="absolute inset-0 bg-[radial-gradient(#EF7D00_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>

                {/* Zambian Flag Horizon Ribbon */}
                <div className="h-1.5 w-full absolute top-0 left-0 flex">
                    <div className="w-1/2 bg-[#198A00]" />
                    <div className="w-1/6 bg-[#DE2010]" />
                    <div className="w-1/6 bg-[#000000]" />
                    <div className="w-1/6 bg-[#EF7D00]" />
                </div>

                <div className="relative z-10 pt-4">
                    <div className="h-16 w-16 bg-[#0B0F17] border border-[#EF7D00]/50 rounded-2xl flex items-center justify-center p-2 mb-8 text-[#EF7D00] shadow-lg shadow-orange-950/40">
                        <Building2 className="h-10 w-10 text-[#EF7D00]" />
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-[#EF7D00] text-xs font-semibold mb-4 border border-[#EF7D00]/30">
                        <span className="h-2 w-2 rounded-full bg-[#DE2010]" />
                        <span>Republic of Zambia • Local Authority</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-4 text-[#EF7D00]">{councilName}</h1>
                    <p className="text-lg text-slate-300 max-w-md leading-relaxed">Local Authority & Citizen Registration Portal</p>
                </div>
                <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800 pt-6">
                    <span>&copy; {new Date().getFullYear()} {councilName}. All rights reserved.</span>
                    <span className="text-[#EF7D00]/80 font-medium">One Zambia, One Nation</span>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex flex-1 items-center justify-center bg-white p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="flex flex-col items-center text-center md:hidden">
                        <div className="h-14 w-14 bg-[#0B0F17] border border-[#EF7D00]/40 rounded-2xl flex items-center justify-center mb-3 text-[#EF7D00]">
                            <Building2 className="h-8 w-8 text-[#EF7D00]" />
                        </div>
                        <h2 className="text-2xl font-black text-[#0B0F17]">{councilName} Portal</h2>
                    </div>

                    <div className="space-y-1.5 text-center md:text-left">
                        <h2 className="text-3xl font-black tracking-tight text-[#0B0F17]">Create Account</h2>
                        <p className="text-slate-500 text-sm">Register to access {councilName} services.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="fullName" className="text-xs font-bold text-slate-700">Full Name</Label>
                            <Input
                                id="fullName"
                                placeholder="Mutale Mwamba"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                className="h-11 border-slate-300 focus:border-[#EF7D00] focus:ring-[#EF7D00]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs font-bold text-slate-700">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="applicant@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="h-11 border-slate-300 focus:border-[#EF7D00] focus:ring-[#EF7D00]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-xs font-bold text-slate-700">Mobile Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+260 97 123 4567"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="h-11 border-slate-300 focus:border-[#EF7D00] focus:ring-[#EF7D00]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-xs font-bold text-slate-700">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="h-11 border-slate-300 focus:border-[#EF7D00] focus:ring-[#EF7D00]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="h-11 border-slate-300 focus:border-[#EF7D00] focus:ring-[#EF7D00]"
                            />
                        </div>

                        {/* Honeypot Field (Hidden) */}
                        <div className="hidden" aria-hidden="true">
                            <Label htmlFor="_honey">Don't fill this out</Label>
                            <Input
                                id="_honey"
                                type="text"
                                value={formData._honey}
                                onChange={handleChange}
                                tabIndex={-1}
                                autoComplete="off"
                            />
                        </div>

                        <Button type="submit" className="w-full h-11 bg-[#EF7D00] text-white hover:bg-[#D96800] font-bold text-base shadow-md shadow-orange-900/10" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Registering...
                                </>
                            ) : "Create Account"}
                        </Button>

                        <div className="text-center text-xs">
                            <span className="text-slate-500">Already have an account? </span>
                            <Link href="/login" className="font-bold text-[#EF7D00] hover:underline">
                                Sign In
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
