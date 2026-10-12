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
            {/* Left Panel - Branding */}
            <div className="hidden md:flex w-1/2 bg-[#0F0F0F] flex-col justify-between p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-yellow-950/40 opacity-80"></div>
                <div className="absolute inset-0 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>

                <div className="relative z-10">
                    <div className="h-16 w-16 bg-yellow-500/10 border border-yellow-500/40 rounded-2xl flex items-center justify-center p-2 mb-8 text-yellow-500 shadow-md">
                        <Building2 className="h-10 w-10" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-4 text-yellow-500">{councilName}</h1>
                    <p className="text-xl text-gray-300 max-w-md">Local Authority & Citizen Registration Portal</p>
                </div>
                <div className="relative z-10 text-sm text-gray-500">
                    &copy; 2026 {councilName}. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex flex-1 items-center justify-center bg-white p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="flex flex-col items-center text-center md:hidden">
                        <div className="h-16 w-16 bg-yellow-500/10 border border-yellow-500/40 rounded-2xl flex items-center justify-center mb-3 text-yellow-600">
                            <Building2 className="h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-black">{councilName} Portal</h2>
                    </div>

                    <div className="space-y-2 text-center md:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-black">Create Account</h2>
                        <p className="text-gray-500">Register to access {councilName} services.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                className="h-11 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="h-11 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Mobile Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+675 ..."
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="h-11 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="h-11 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="h-11 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
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

                        <Button type="submit" className="w-full h-11 bg-black text-yellow-500 hover:bg-gray-900 hover:text-yellow-400 font-semibold text-lg" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Registering...
                                </>
                            ) : "Create Account"}
                        </Button>

                        <div className="text-center text-sm">
                            <span className="text-gray-500">Already have an account? </span>
                            <Link href="/" className="font-medium text-yellow-600 hover:text-yellow-700 hover:underline">
                                Sign in
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
