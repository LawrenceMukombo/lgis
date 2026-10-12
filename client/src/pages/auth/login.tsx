import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Building2 } from "lucide-react";
import { useOrganization } from "@/contexts/organization-context";
import { useCountries } from "@/hooks/use-countries";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentOrganization, selectedCountryId } = useOrganization();
  const { data: countries = [] } = useCountries();

  const activeCountry = countries.find(c => c.countryId === selectedCountryId) ||
    countries.find(c => c.countryCode === 'ZM') ||
    countries[0];

  const councilName = currentOrganization?.name || "Lusaka City Council";
  const countryName = activeCountry?.name || "Republic of Zambia";

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiRequest("POST", "/api/login", formData);
      const user = await res.json();

      queryClient.setQueryData(["/api/user"], user);

      toast({
        title: "Welcome back",
        description: `Logged in as ${user.fullName}`,
      });

      const isMobile = import.meta.env.VITE_IS_MOBILE || /Android|iPhone/i.test(navigator.userAgent);

      if (isMobile) {
        setLocation("/mobile/dashboard");
      } else {
        if (user.role === "user") {
          setLocation("/portal");
        } else {
          setLocation("/dashboard");
        }
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-lg text-slate-300 max-w-md leading-relaxed">
            Local Government Information System (LGIS) & Digital Citizen Services
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800 pt-6">
          <span>&copy; {new Date().getFullYear()} {councilName}</span>
          <span className="text-[#EF7D00]/80 font-medium">One Zambia, One Nation</span>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 items-center justify-center bg-white p-8">
        <div className="w-full max-w-md space-y-7">
          <div className="flex flex-col items-center text-center md:hidden">
            <div className="h-14 w-14 bg-[#0B0F17] border border-[#EF7D00]/40 rounded-2xl flex items-center justify-center mb-3 text-[#EF7D00]">
              <Building2 className="h-8 w-8 text-[#EF7D00]" />
            </div>
            <h2 className="text-2xl font-black text-[#0B0F17]">{councilName}</h2>
          </div>

          <div className="space-y-1.5 text-center md:text-left">
            <h2 className="text-3xl font-black tracking-tight text-[#0B0F17]">Sign In</h2>
            <p className="text-slate-500 text-sm">Access your {councilName} compliance, licensing, and administration workspace.</p>
          </div>

          {/* Quick Demo Credentials Assistant */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#198A00]" />
                Demo Credentials (Click to fill)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Password: admin123</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFormData({ email: "admin@lcc.gov.zm", password: "admin123" })}
                className="text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#EF7D00] hover:bg-orange-50/50 transition-colors"
              >
                <div className="font-bold text-slate-900 truncate">🇿🇲 Lusaka Admin</div>
                <div className="text-[11px] text-slate-500 truncate">admin@lcc.gov.zm</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ email: "officer@lcc.gov.zm", password: "officer123" })}
                className="text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#EF7D00] hover:bg-orange-50/50 transition-colors"
              >
                <div className="font-bold text-slate-900 truncate">🇿🇲 Lusaka Officer</div>
                <div className="text-[11px] text-slate-500 truncate">officer@lcc.gov.zm</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@lcc.gov.zm"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-11 border-slate-300 focus:border-[#EF7D00] focus:ring-[#EF7D00]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-slate-700">Password</Label>
                <a href="#" className="text-xs font-medium text-[#EF7D00] hover:text-[#D96800] hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="h-11 border-slate-300 focus:border-[#EF7D00] focus:ring-[#EF7D00]"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[#EF7D00] text-white hover:bg-[#D96800] font-bold text-base shadow-md shadow-orange-900/10"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : "Sign In to Council Portal"}
            </Button>

            <div className="text-center text-xs">
              <span className="text-slate-500">Don't have an applicant account? </span>
              <Link href="/register" className="font-bold text-[#EF7D00] hover:underline">
                Create one now
              </Link>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-white px-3 text-slate-400 font-semibold">Official Government System</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
