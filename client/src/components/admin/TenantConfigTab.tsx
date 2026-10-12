import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    Palette,
    MapPin,
    Globe,
    Upload,
    Eye,
    Download,
    Upload as UploadIcon,
    Plus,
    X,
    GripVertical,
    Sparkles,
    Package,
    Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/providers/TenantProvider";
import { hexToHsl, hslToHex, getContrastColor, hexToHslComponents, loadGoogleFont } from "@/lib/colors";

// Pre-defined font options
const FONT_OPTIONS = [
    "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins",
    "Source Sans Pro", "Raleway", "Ubuntu", "Nunito"
];

// Common locale options
const LOCALE_OPTIONS = [
    { value: "en-US", label: "English (United States)" },
    { value: "en-GB", label: "English (United Kingdom)" },
    { value: "en-PG", label: "English (Papua New Guinea)" },
    { value: "en-AU", label: "English (Australia)" },
    { value: "fr-FR", label: "French (France)" },
    { value: "es-ES", label: "Spanish (Spain)" },
    { value: "zh-CN", label: "Chinese (Simplified)" },
    { value: "ja-JP", label: "Japanese" },
    { value: "ar-SA", label: "Arabic (Saudi Arabia)" },
];

// Timezone options (major ones)
const TIMEZONE_OPTIONS = [
    { value: "Pacific/Port_Moresby", label: "Port Moresby (GMT+10)" },
    { value: "Pacific/Auckland", label: "Auckland (GMT+12)" },
    { value: "Australia/Sydney", label: "Sydney (GMT+10)" },
    { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
    { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
    { value: "Europe/London", label: "London (GMT+0)" },
    { value: "America/New_York", label: "New York (GMT-5)" },
    { value: "America/Los_Angeles", label: "Los Angeles (GMT-8)" },
];

// Currency options
const CURRENCY_OPTIONS = [
    { value: "PGK", label: "Papua New Guinea Kina (K)", symbol: "K" },
    { value: "USD", label: "US Dollar ($)", symbol: "$" },
    { value: "AUD", label: "Australian Dollar ($)", symbol: "A$" },
    { value: "EUR", label: "Euro (€)", symbol: "€" },
    { value: "GBP", label: "British Pound (£)", symbol: "£" },
    { value: "JPY", label: "Japanese Yen (¥)", symbol: "¥" },
];

export function TenantConfigTab() {
    const { config, updateConfig } = useTenant();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [previewLogo, setPreviewLogo] = useState<string | null>(config?.logoUrl || '/logo.png');

    // Local state for form
    const [formData, setFormData] = useState(config || {
        councilId: '',
        councilName: '',
        shortName: '',
        primaryColor: '#1e40af',
        secondaryColor: '#7c3aed',
        accentColor: '#f59e0b',
        fontFamily: 'Inter',
        locationLevels: [],
        enabledModules: [
            "dashboard", "registry", "licensing", "services", "payments",
            "inspections", "enforcement", "complaints", "audit",
            "gis", "properties", "planning", "environment", "building",
            "assets", "waste", "procurement", "fleet",
            "portal", "mobile", "notifications", "feedback",
            "reports", "api", "documents", "workflows", "configuration"
        ]
    } as any);
    const [locationLevels, setLocationLevels] = useState<string[]>(config?.locationLevels || []);

    // Sync local state when config loads
    useEffect(() => {
        if (config) {
            const initialModules = config.enabledModules && config.enabledModules.length > 0
                ? config.enabledModules
                : [
                    "dashboard", "registry", "licensing", "services", "payments",
                    "inspections", "enforcement", "complaints", "audit",
                    "gis", "properties", "planning", "environment", "building",
                    "assets", "waste", "procurement", "fleet",
                    "portal", "mobile", "notifications", "feedback",
                    "reports", "api", "documents", "workflows", "configuration"
                ];

            setFormData({
                ...config,
                enabledModules: initialModules
            });
            setLocationLevels(config.locationLevels || []);
            // Only update preview if we don't have a new file being uploaded
            if (config.logoUrl && !logoFile) {
                setPreviewLogo(config.logoUrl);
            }
        }
    }, [config, logoFile]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreviewLogo(result);
                // Automatically extract theme when logo is uploaded
                extractThemeFromLogo(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const extractThemeFromLogo = async (imgSource?: string | React.MouseEvent) => {
        const source = typeof imgSource === 'string' ? imgSource : previewLogo;
        if (!source) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = source;

        img.onerror = () => {
            toast({
                title: "Extraction Failed",
                description: "Could not load the logo image for analysis.",
                variant: "destructive"
            });
        };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Use slightly larger dimensions for better character but still fast
            const scale = Math.min(1, 300 / Math.max(img.width, img.height));
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const colorCounts: Record<string, number> = {};

            // Denser sampling for "Aggressive" extraction
            for (let i = 0; i < imageData.length; i += 8) { // Sample every 2nd pixel
                const r = imageData[i];
                const g = imageData[i + 1];
                const b = imageData[i + 2];
                const alpha = imageData[i + 3];

                if (alpha < 150) continue; // Skip transparency

                // Filter out absolute white and absolute black during initial bucket phase
                if (r > 245 && g > 245 && b > 245) continue;
                if (r < 10 && g < 10 && b < 10) continue;

                // Quantization (4-bit per channel for bucket grouping)
                const qr = Math.round(r / 16) * 16;
                const qg = Math.round(g / 16) * 16;
                const qb = Math.round(b / 16) * 16;

                const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;
                colorCounts[hex] = (colorCounts[hex] || 0) + 1;
            }

            // Convert and extract HSL
            const sortedColors = Object.entries(colorCounts)
                .map(([hex, count]) => {
                    const r = parseInt(hex.slice(1, 3), 16) / 255;
                    const g = parseInt(hex.slice(3, 5), 16) / 255;
                    const b = parseInt(hex.slice(5, 7), 16) / 255;
                    const max = Math.max(r, g, b), min = Math.min(r, g, b);
                    let h = 0, s, l = (max + min) / 2;
                    if (max !== min) {
                        const d = max - min;
                        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                        switch (max) {
                            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                            case g: h = (b - r) / d + 2; break;
                            case b: h = (r - g) / d + 4; break;
                        }
                        h /= 6;
                    } else { s = 0; }
                    return { hex, count, h: h * 360, s: s * 100, l: l * 100 };
                })
                .sort((a, b) => b.count - a.count);

            // Smart Selection Algorithm
            // ---------------------------

            // 1. Identify "Vibrants" (S > 30, 20 < L < 80)
            const vibrants = sortedColors.filter(c => c.s > 30 && c.l > 20 && c.l < 80);

            // 2. Identify "Dark Neutrals" (L < 25)
            const darks = sortedColors.filter(c => c.l < 25);

            let primary = formData.primaryColor;
            let secondary = formData.secondaryColor;
            let accent = formData.accentColor;

            // NCDC Special Palette logic (Yellow/Black/Red character)
            const yellows = vibrants.filter(c => c.h >= 40 && c.h <= 62);
            const reds = vibrants.filter(c => (c.h >= 0 && c.h <= 15) || (c.h >= 340));

            if (yellows.length > 0) {
                // Secondary is the brand yellow
                secondary = yellows[0].hex;
                // Primary: usually a dark contrast in NCDC logos
                primary = darks.length > 0 ? darks[0].hex : "#1A1A1A";
                // Accent: find a high-contrast vibrant (like red)
                accent = reds.length > 0 ? reds[0].hex : (vibrants.find(v => v.hex !== secondary)?.hex || "#EF4444");
            } else if (vibrants.length > 0) {
                // Dominant vibrant as Primary
                primary = vibrants[0].hex;

                // Find a secondary with distinct hue if possible
                secondary = vibrants.find(v => Math.abs(v.h - vibrants[0].h) > 40)?.hex ||
                    sortedColors.find(c => c.hex !== primary && c.l > 40 && c.l < 90)?.hex ||
                    primary;

                // Accent: find something else or use a complementary
                accent = vibrants.find(v => v.hex !== primary && v.hex !== secondary)?.hex || "#F59E0B";
            }

            if (sortedColors.length === 0) {
                // Fallback to defaults only if extraction returned absolutely nothing
                primary = "#1e40af";
                secondary = "#7c3aed";
                accent = "#f59e0b";
            }

            setFormData(prev => ({
                ...prev,
                primaryColor: primary,
                secondaryColor: secondary,
                accentColor: accent
            }));

            toast({
                title: "Aggressive Extraction Successful",
                description: `Branding analyzed. ${yellows.length > 0 ? 'High-contrast NCDC profile' : 'Vibrant brand profile'} applied as a live preview.`,
            });
        };
    };

    // Live Preview Effect: Apply form changes to global CSS tokens immediately
    useEffect(() => {
        if (formData) {
            const root = document.documentElement;

            const applyScale = (baseColor: string, prefix: string) => {
                const { h, s, l } = hexToHsl(baseColor);
                root.style.setProperty(`--accent-${prefix}-default`, baseColor);
                root.style.setProperty(`--accent-${prefix}-stronger`, hslToHex(h, s, Math.max(0, l - 15)));
                root.style.setProperty(`--accent-${prefix}-strongest`, hslToHex(h, s, Math.max(0, l - 30)));
                root.style.setProperty(`--accent-${prefix}-dimmer`, hslToHex(h, s, Math.min(100, l + 20)));
                root.style.setProperty(`--accent-${prefix}-dimmest`, hslToHex(h, s, Math.min(100, l + 40)));
            };

            // 1. Scales
            applyScale(formData.primaryColor, 'primary');
            applyScale(formData.secondaryColor || '#10b981', 'positive');
            applyScale(formData.accentColor || '#f59e0b', 'warning');
            applyScale('#ef4444', 'negative');

            root.style.setProperty('--color-primary', formData.primaryColor);
            root.style.setProperty('--color-secondary', formData.secondaryColor || '#10b981');

            // 2. Manual Overrides
            if (formData.backgroundRootColor) root.style.setProperty('--background-root', formData.backgroundRootColor);
            if (formData.backgroundDefaultColor) root.style.setProperty('--background-default', formData.backgroundDefaultColor);
            if (formData.backgroundHigherColor) {
                root.style.setProperty('--background-higher', formData.backgroundHigherColor);
                const higherHsl = hexToHsl(formData.backgroundHigherColor);
                root.style.setProperty('--background-highest', hslToHex(higherHsl.h, higherHsl.s, Math.max(0, higherHsl.l - 5)));
            }
            if (formData.foregroundDefaultColor) root.style.setProperty('--foreground-default', formData.foregroundDefaultColor);
            if (formData.foregroundDimmerColor) {
                root.style.setProperty('--foreground-dimmer', formData.foregroundDimmerColor);
                const dimmerHsl = hexToHsl(formData.foregroundDimmerColor);
                root.style.setProperty('--foreground-dimmest', hslToHex(dimmerHsl.h, dimmerHsl.s, Math.min(100, dimmerHsl.l + 15)));
            }
            if (formData.outlineColor) root.style.setProperty('--outline-dimmer', formData.outlineColor);

            // 3. Compatibility Tokens
            const primaryHsl = hexToHsl(formData.primaryColor);
            const primaryForegroundHex = getContrastColor(formData.primaryColor);
            const isNCDC = (formData.primaryColor.toLowerCase() === '#000000' || formData.primaryColor.toLowerCase() === '#1a1a1a' || formData.primaryColor.toLowerCase() === '#07080a');

            root.style.setProperty('--primary', `${Math.round(primaryHsl.h)} ${Math.round(primaryHsl.s)}% ${Math.round(primaryHsl.l)}%`);

            let pForeground = hexToHslComponents(primaryForegroundHex);
            if (isNCDC) pForeground = '52 100% 50%'; // Brand Yellow
            if (formData.foregroundDefaultColor) pForeground = hexToHslComponents(formData.foregroundDefaultColor);

            root.style.setProperty('--primary-foreground', pForeground);
            root.style.setProperty('--destructive-foreground', '0 0% 100%');

            // 4. Advanced Status Overrides
            if (formData.positiveColor) applyScale(formData.positiveColor, 'positive');
            if (formData.warningColor) applyScale(formData.warningColor, 'warning');
            if (formData.negativeColor) applyScale(formData.negativeColor, 'negative');

            // 5. Surface & Styling Overrides
            if (formData.sidebarBackground) root.style.setProperty('--sidebar-background', formData.sidebarBackground);
            if (formData.sidebarForeground) root.style.setProperty('--sidebar-foreground', formData.sidebarForeground);
            if (formData.headerBackground) root.style.setProperty('--header-background', formData.headerBackground);
            if (formData.headerForeground) root.style.setProperty('--header-foreground', formData.headerForeground);
            if (formData.cardBackground) root.style.setProperty('--card-background', formData.cardBackground);

            if (formData.borderRadius !== undefined) {
                root.style.setProperty('--border-radius-global', `${formData.borderRadius}px`);
                root.style.setProperty('--radius', `${formData.borderRadius / 8}rem`);
            }
            if (formData.buttonRadius !== undefined) root.style.setProperty('--border-radius-button', `${formData.buttonRadius}px`);
            if (formData.cardRadius !== undefined) root.style.setProperty('--border-radius-card', `${formData.cardRadius}px`);
            if (formData.inputRadius !== undefined) root.style.setProperty('--border-radius-input', `${formData.inputRadius}px`);

            // 6. Font
            root.style.setProperty('--font-family', formData.fontFamily);
            root.style.setProperty('--font-family-default', `"${formData.fontFamily}", "IBM Plex Sans", system-ui, sans-serif`);

            if (formData.fontFamily !== 'Inter' && formData.fontFamily !== 'system-ui') {
                loadGoogleFont(formData.fontFamily);
            }
        }
    }, [
        formData.primaryColor,
        formData.secondaryColor,
        formData.accentColor,
        formData.backgroundRootColor,
        formData.backgroundDefaultColor,
        formData.backgroundHigherColor,
        formData.foregroundDefaultColor,
        formData.foregroundDimmerColor,
        formData.outlineColor,
        formData.fontFamily
    ]);

    // Helper to calculate color distance
    function colorDistance(hex1: string, hex2: string) {
        const r1 = parseInt(hex1.substring(1, 3), 16);
        const g1 = parseInt(hex1.substring(3, 5), 16);
        const b1 = parseInt(hex1.substring(5, 7), 16);
        const r2 = parseInt(hex2.substring(1, 3), 16);
        const g2 = parseInt(hex2.substring(3, 5), 16);
        const b2 = parseInt(hex2.substring(5, 7), 16);
        return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
    }

    const addLocationLevel = () => {
        setLocationLevels([...locationLevels, 'New Level']);
    };

    const removeLocationLevel = (index: number) => {
        setLocationLevels(locationLevels.filter((_, i) => i !== index));
    };

    const updateLocationLevel = (index: number, value: string) => {
        const updated = [...locationLevels];
        updated[index] = value;
        setLocationLevels(updated);
    };

    const toggleModule = (moduleId: string) => {
        const current = formData.enabledModules || [];
        const updated = current.includes(moduleId)
            ? current.filter(id => id !== moduleId)
            : [...current, moduleId];

        setFormData({ ...formData, enabledModules: updated });
    };

    const resetToNCDC = () => {
        const ncdcDefaults = {
            councilId: '3c4d4a9f-92a7-4dd2-82fb-ceff90c57094',
            councilName: 'National Capital District Commission',
            shortName: 'NCDC',
            primaryColor: '#0F0F0F',
            secondaryColor: '#F4C400',
            accentColor: '#F4C400',
            backgroundRootColor: '#EBECED',
            backgroundDefaultColor: '#FCFCFC',
            backgroundHigherColor: '#F0F1F2',
            foregroundDefaultColor: '#07080A',
            foregroundDimmerColor: '#3D4047',
            outlineColor: '#C0C3C4',
            sidebarBackground: '#0F0F0F',
            sidebarForeground: '#FFFFFF',
            headerBackground: '#F4C400',
            headerForeground: '#000000',
            fontFamily: 'Inter',
            logoUrl: '/logo.png'
        };
        setFormData((prev: any) => ({ ...prev, ...ncdcDefaults }));
        setPreviewLogo('/logo.png');
        toast({ title: "NCDC Profile Loaded", description: "Click Save to apply these official settings." });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let finalLogoUrl = formData.logoUrl;

            // Handle Logo Upload if a new file was selected
            if (logoFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', logoFile);
                uploadFormData.append('councilId', formData.councilId);
                uploadFormData.append('ownerType', 'council');
                uploadFormData.append('ownerId', formData.councilId);
                uploadFormData.append('type', 'logo');

                const response = await fetch('/api/v1/uploads', {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (response.ok) {
                    const data = await response.json();
                    // Ensure path uses forward slashes and has a leading slash
                    const formattedPath = data.filePath.replace(/\\/g, '/');
                    finalLogoUrl = formattedPath.startsWith('/') ? formattedPath : '/' + formattedPath;
                } else {
                    throw new Error("Logo upload failed");
                }
            }

            // Update configuration with all changes
            await updateConfig({
                ...formData,
                logoUrl: finalLogoUrl,
                locationLevels
            });

            // Update local storage to ensure consistency
            localStorage.setItem('currentOrganization', JSON.stringify({
                ...formData,
                logoUrl: finalLogoUrl,
                locationLevels
            }));

            toast({
                title: "Configuration Saved",
                description: "Council settings and branding have been updated successfully.",
            });
        } catch (error) {
            console.error("Save error:", error);
            toast({
                title: "Error Saving",
                description: "Failed to update configuration. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="branding" className="space-y-6">
                <TabsList className="bg-white border">
                    <TabsTrigger value="branding" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        Branding
                    </TabsTrigger>
                    <TabsTrigger value="theme" className="gap-2">
                        <Palette className="h-4 w-4" />
                        Theme
                    </TabsTrigger>
                    <TabsTrigger value="modules" className="gap-2">
                        <Package className="h-4 w-4" />
                        Modules
                    </TabsTrigger>
                    <TabsTrigger value="location" className="gap-2">
                        <MapPin className="h-4 w-4" />
                        Location Hierarchy
                    </TabsTrigger>
                    <TabsTrigger value="localization" className="gap-2">
                        <Globe className="h-4 w-4" />
                        Localization
                    </TabsTrigger>
                </TabsList>

                {/* Branding Section */}
                <TabsContent value="branding" className="space-y-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-blue-600" />
                                    Council Identity
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                                    onClick={resetToNCDC}
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Restore NCDC Defaults
                                </Button>
                            </CardTitle>
                            <CardDescription>Configure council name, logo, and branding assets</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Left Column - Form */}
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="council-name">Full Council Name *</Label>
                                        <Input
                                            id="council-name"
                                            value={formData.councilName}
                                            onChange={(e) => setFormData({ ...formData, councilName: e.target.value })}
                                            placeholder="National Capital District Commission"
                                            title="Full Council Name"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="short-name">Short Name / Acronym *</Label>
                                        <Input
                                            id="short-name"
                                            value={formData.shortName}
                                            onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                                            placeholder="NCDC"
                                            title="Council Short Name"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="tagline">Tagline</Label>
                                        <Input
                                            id="tagline"
                                            value={formData.tagline || ''}
                                            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                            placeholder="City of Excellence"
                                            title="Council Tagline"
                                        />
                                    </div>

                                    {/* Logo Upload */}
                                    <div>
                                        <Label htmlFor="logo-upload">Council Logo</Label>
                                        <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                id="logo-upload"
                                                title="Upload Council Logo"
                                            />
                                            <div className="cursor-pointer">
                                                {previewLogo || formData.logoUrl || '/logo.png' ? (
                                                    <img src={previewLogo || formData.logoUrl || '/logo.png'} alt="Logo preview" className="h-24 mx-auto" />
                                                ) : (
                                                    <>
                                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                                        <p className="text-sm text-muted-foreground">
                                                            Click to upload logo (PNG, SVG, JPG)
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {previewLogo && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 w-full border-2 border-black font-bold"
                                                onClick={extractThemeFromLogo}
                                            >
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                Extract Theme from Logo
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column - Preview */}
                                <div>
                                    <Label>Preview</Label>
                                    <Card className="mt-2 bg-gradient-to-br from-slate-50 to-blue-50">
                                        <CardContent className="p-6">
                                            <div className="text-center space-y-3">
                                                {previewLogo && (
                                                    <img src={previewLogo} alt="Logo" className="h-20 mx-auto" />
                                                )}
                                                <h3 className="text-2xl font-bold">{formData.councilName || 'Council Name'}</h3>
                                                {formData.tagline && (
                                                    <p className="text-sm text-muted-foreground italic">{formData.tagline}</p>
                                                )}
                                                <Badge>{formData.shortName || 'SHORT'}</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Contact Info */}
                                    <div className="mt-6 space-y-3">
                                        <Label htmlFor="contact-address">Contact Information</Label>
                                        <Input
                                            id="contact-address"
                                            placeholder="Address"
                                            value={formData.address || ''}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            title="Council Address"
                                        />
                                        <Input
                                            id="contact-phone"
                                            placeholder="Phone"
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            title="Council Phone Number"
                                        />
                                        <Input
                                            id="contact-email"
                                            placeholder="Email"
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            title="Council Email Address"
                                        />
                                        <Input
                                            id="contact-website"
                                            placeholder="Website"
                                            value={formData.website || ''}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            title="Council Website URL"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Theme Section */}
                <TabsContent value="theme" className="space-y-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5 text-purple-600" />
                                Visual Theme
                            </CardTitle>
                            <CardDescription>Customize colors and typography</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="primary-color">Primary Color</Label>
                                        <div className="flex gap-2 items-center mt-2">
                                            <input
                                                id="primary-color"
                                                type="color"
                                                value={formData.primaryColor}
                                                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                                className="h-10 w-20 rounded border cursor-pointer"
                                                title="Primary Color Picker"
                                                placeholder="#1e40af"
                                            />
                                            <Input
                                                id="primary-color-hex"
                                                value={formData.primaryColor}
                                                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                                placeholder="#1e40af"
                                                title="Primary Color Hex Code"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="secondary-color">Secondary Color</Label>
                                        <div className="flex gap-2 items-center mt-2">
                                            <input
                                                id="secondary-color"
                                                type="color"
                                                value={formData.secondaryColor}
                                                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                                className="h-10 w-20 rounded border cursor-pointer"
                                                title="Secondary Color Picker"
                                                placeholder="#7c3aed"
                                            />
                                            <Input
                                                id="secondary-color-hex"
                                                value={formData.secondaryColor}
                                                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                                placeholder="#7c3aed"
                                                title="Secondary Color Hex Code"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="accent-color">Accent Color</Label>
                                        <div className="flex gap-2 items-center mt-2">
                                            <input
                                                id="accent-color"
                                                type="color"
                                                value={formData.accentColor}
                                                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                                                className="h-10 w-20 rounded border cursor-pointer"
                                                title="Accent Color Picker"
                                                placeholder="#f59e0b"
                                            />
                                            <Input
                                                id="accent-color-hex"
                                                value={formData.accentColor}
                                                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                                                placeholder="#f59e0b"
                                                title="Accent Color Hex Code"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Font Family</Label>
                                        <Select
                                            value={formData.fontFamily}
                                            onValueChange={(value) => setFormData({ ...formData, fontFamily: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {FONT_OPTIONS.map(font => (
                                                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                                        {font}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Theme Preview */}
                                <div className="space-y-6">
                                    <div>
                                        <Label>Live Preview</Label>
                                        <Card className="mt-2 bg-background-default border-outline-dimmer">
                                            <CardContent className="p-6 space-y-4">
                                                <div
                                                    className="h-20 rounded-lg flex items-center justify-center text-primary-foreground font-semibold shadow-md bg-primary"
                                                >
                                                    Primary Color
                                                </div>
                                                <div
                                                    className="h-16 rounded-lg flex items-center justify-center text-secondary-foreground shadow-sm bg-secondary"
                                                >
                                                    Secondary Color
                                                </div>
                                                <div className="p-4 rounded-lg border bg-background-higher border-outline-dimmer">
                                                    <p className="text-center font-bold text-foreground-default">
                                                        Main Typography Preview
                                                    </p>
                                                    <p className="text-center text-sm text-foreground-dimmer">
                                                        Dimmed/Subtle typography preview
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Advanced Branding Suite */}
                                    <div className="space-y-6 pt-6 border-t border-outline-dimmer mt-6">
                                        <h4 className="font-bold flex items-center gap-2 text-primary">
                                            <Sparkles className="h-4 w-4" />
                                            Manual Branding & Surface Overrides
                                        </h4>
                                        <p className="text-xs text-muted-foreground">Precisely control every surface, status color, and component radius in the system.</p>

                                        {/* Status & Action Colors */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Status & Action Colors</Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="positive-color" className="text-[10px] uppercase opacity-60">Positive</Label>
                                                    <input
                                                        id="positive-color"
                                                        type="color"
                                                        value={formData.positiveColor || '#10b981'}
                                                        onChange={(e) => setFormData({ ...formData, positiveColor: e.target.value })}
                                                        className="h-8 w-full rounded border cursor-pointer"
                                                        title="Positive Status Color"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="warning-color" className="text-[10px] uppercase opacity-60">Warning</Label>
                                                    <input
                                                        id="warning-color"
                                                        type="color"
                                                        value={formData.warningColor || '#f59e0b'}
                                                        onChange={(e) => setFormData({ ...formData, warningColor: e.target.value })}
                                                        className="h-8 w-full rounded border cursor-pointer"
                                                        title="Warning Status Color"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="negative-color" className="text-[10px] uppercase opacity-60">Negative</Label>
                                                    <input
                                                        id="negative-color"
                                                        type="color"
                                                        value={formData.negativeColor || '#ef4444'}
                                                        onChange={(e) => setFormData({ ...formData, negativeColor: e.target.value })}
                                                        className="h-8 w-full rounded border cursor-pointer"
                                                        title="Negative Status Color"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Surface Overrides */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Surface Overrides</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="sidebar-bg" className="text-[10px] uppercase opacity-60">Sidebar Background</Label>
                                                    <input
                                                        id="sidebar-bg"
                                                        type="color"
                                                        value={formData.sidebarBackground || formData.backgroundHigherColor || '#F0F1F2'}
                                                        onChange={(e) => setFormData({ ...formData, sidebarBackground: e.target.value })}
                                                        className="h-8 w-full rounded border cursor-pointer"
                                                        title="Sidebar Background Color"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="header-bg" className="text-[10px] uppercase opacity-60">Header Background</Label>
                                                    <input
                                                        id="header-bg"
                                                        type="color"
                                                        value={formData.headerBackground || formData.backgroundDefaultColor || '#FCFCFC'}
                                                        onChange={(e) => setFormData({ ...formData, headerBackground: e.target.value })}
                                                        className="h-8 w-full rounded border cursor-pointer"
                                                        title="Header Background Color"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Component Shaping */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Component Shaping (Radius PX)</Label>
                                            <div className="grid grid-cols-4 gap-2">
                                                <div className="space-y-1">
                                                    <Label htmlFor="radius-global" className="text-[9px] uppercase opacity-60">Global</Label>
                                                    <Input
                                                        id="radius-global"
                                                        type="number"
                                                        value={formData.borderRadius ?? 4}
                                                        onChange={(e) => setFormData({ ...formData, borderRadius: parseInt(e.target.value) })}
                                                        className="h-8 px-1 text-center"
                                                        title="Global Border Radius"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="radius-buttons" className="text-[9px] uppercase opacity-60">Buttons</Label>
                                                    <Input
                                                        id="radius-buttons"
                                                        type="number"
                                                        value={formData.buttonRadius ?? 4}
                                                        onChange={(e) => setFormData({ ...formData, buttonRadius: parseInt(e.target.value) })}
                                                        className="h-8 px-1 text-center"
                                                        title="Button Border Radius"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="radius-cards" className="text-[9px] uppercase opacity-60">Cards</Label>
                                                    <Input
                                                        id="radius-cards"
                                                        type="number"
                                                        value={formData.cardRadius ?? 8}
                                                        onChange={(e) => setFormData({ ...formData, cardRadius: parseInt(e.target.value) })}
                                                        className="h-8 px-1 text-center"
                                                        title="Card Border Radius"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="radius-inputs" className="text-[9px] uppercase opacity-60">Inputs</Label>
                                                    <Input
                                                        id="radius-inputs"
                                                        type="number"
                                                        value={formData.inputRadius ?? 4}
                                                        onChange={(e) => setFormData({ ...formData, inputRadius: parseInt(e.target.value) })}
                                                        className="h-8 px-1 text-center"
                                                        title="Input Border Radius"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="bg-root-color" className="text-xs">Root Background</Label>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        id="bg-root-color"
                                                        type="color"
                                                        value={formData.backgroundRootColor || '#EBECED'}
                                                        onChange={(e) => setFormData({ ...formData, backgroundRootColor: e.target.value })}
                                                        className="h-8 w-8 rounded border cursor-pointer"
                                                        title="Root Background Color Picker"
                                                    />
                                                    <Input
                                                        id="bg-root-color-hex"
                                                        value={formData.backgroundRootColor}
                                                        onChange={(e) => setFormData({ ...formData, backgroundRootColor: e.target.value })}
                                                        className="h-8 text-xs font-mono"
                                                        placeholder="#EBECED"
                                                        title="Root Background Color Hex"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="bg-default-color" className="text-xs">Card Surface</Label>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        id="bg-default-color"
                                                        type="color"
                                                        value={formData.backgroundDefaultColor || '#FCFCFC'}
                                                        onChange={(e) => setFormData({ ...formData, backgroundDefaultColor: e.target.value })}
                                                        className="h-8 w-8 rounded border cursor-pointer"
                                                        title="Card Surface Color Picker"
                                                    />
                                                    <Input
                                                        id="bg-default-color-hex"
                                                        value={formData.backgroundDefaultColor}
                                                        onChange={(e) => setFormData({ ...formData, backgroundDefaultColor: e.target.value })}
                                                        className="h-8 text-xs font-mono"
                                                        placeholder="#FCFCFC"
                                                        title="Card Surface Color Hex"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="fg-default-color" className="text-xs">Default Text</Label>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        id="fg-default-color"
                                                        type="color"
                                                        value={formData.foregroundDefaultColor || '#07080A'}
                                                        onChange={(e) => setFormData({ ...formData, foregroundDefaultColor: e.target.value })}
                                                        className="h-8 w-8 rounded border cursor-pointer"
                                                        title="Default Text Color Picker"
                                                    />
                                                    <Input
                                                        id="fg-default-color-hex"
                                                        value={formData.foregroundDefaultColor}
                                                        onChange={(e) => setFormData({ ...formData, foregroundDefaultColor: e.target.value })}
                                                        className="h-8 text-xs font-mono"
                                                        placeholder="#07080A"
                                                        title="Default Text Color Hex"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="outline-color" className="text-xs">Outline/Border</Label>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        id="outline-color"
                                                        type="color"
                                                        value={formData.outlineColor || '#C0C3C4'}
                                                        onChange={(e) => setFormData({ ...formData, outlineColor: e.target.value })}
                                                        className="h-8 w-8 rounded border cursor-pointer"
                                                        title="Outline/Border Color Picker"
                                                    />
                                                    <Input
                                                        id="outline-color-hex"
                                                        value={formData.outlineColor}
                                                        onChange={(e) => setFormData({ ...formData, outlineColor: e.target.value })}
                                                        className="h-8 text-xs font-mono"
                                                        placeholder="#C0C3C4"
                                                        title="Outline/Border Color Hex"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Modules Section */}
                <TabsContent value="modules" className="space-y-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-indigo-600" />
                                Module Activation
                            </CardTitle>
                            <CardDescription>Enable or disable application modules for your council</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Core Modules */}
                            <div>
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-blue-600"></span>
                                    Core Modules
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: "registry", name: "Registry", description: "Citizens, Businesses & Properties", icon: "📋", recommended: true },
                                        { id: "licensing", name: "Licensing", description: "License applications & approvals", icon: "🎫", recommended: true },
                                        { id: "services", name: "Services", description: "Service catalogue & requests", icon: "🔧", recommended: true },
                                        { id: "payments", name: "Payments & Revenue", description: "Financial transactions & invoicing", icon: "💳", recommended: true },
                                    ].map(module => (
                                        <Card key={module.id} className="border-2 hover:border-primary transition-colors">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex gap-3 flex-1">
                                                        <div className="text-2xl">{module.icon}</div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold">{module.name}</h4>
                                                                {module.recommended && (
                                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                                                        Recommended
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        id={`module-${module.id}`}
                                                        checked={!!formData.enabledModules?.includes(module.id)}
                                                        onCheckedChange={() => toggleModule(module.id)}
                                                        className="data-[state=checked]:bg-[#EF7D00] data-[state=checked]:border-[#EF7D00] data-[state=unchecked]:bg-slate-300"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Compliance & Enforcement */}
                            <div>
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-red-600"></span>
                                    Compliance & Enforcement
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: "inspections", name: "Inspections", description: "Schedule and manage inspections", icon: "🔍" },
                                        { id: "enforcement", name: "Enforcement", description: "Violations & enforcement actions", icon: "⚖️" },
                                        { id: "complaints", name: "Complaints", description: "Public complaints management", icon: "📢" },
                                        { id: "audit", name: "Audit & Compliance", description: "Audit trails & compliance logs", icon: "📊" },
                                    ].map(module => (
                                        <Card key={module.id} className="border-2 hover:border-primary transition-colors">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex gap-3 flex-1">
                                                        <div className="text-2xl">{module.icon}</div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold">{module.name}</h4>
                                                            <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        id={`module-${module.id}`}
                                                        checked={!!formData.enabledModules?.includes(module.id)}
                                                        onCheckedChange={() => toggleModule(module.id)}
                                                        className="data-[state=checked]:bg-[#EF7D00] data-[state=checked]:border-[#EF7D00] data-[state=unchecked]:bg-slate-300"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Planning & Development */}
                            <div>
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-purple-600"></span>
                                    Planning & Development
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: "gis", name: "GIS & Mapping", description: "Geographic information system", icon: "🗺️" },
                                        { id: "planning", name: "Planning & Zoning", description: "Land use & zoning management", icon: "🏗️" },
                                        { id: "environment", name: "Environmental", description: "Environmental assessments & permits", icon: "🌿" },
                                        { id: "building", name: "Building Control", description: "Building permits & approvals", icon: "🏢" },
                                        { id: "properties", name: "Assets & Properties", description: "Property & land registry", icon: "🏠" },
                                    ].map(module => (
                                        <Card key={module.id} className="border-2 hover:border-primary transition-colors">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex gap-3 flex-1">
                                                        <div className="text-2xl">{module.icon}</div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold">{module.name}</h4>
                                                            <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        id={`module-${module.id}`}
                                                        checked={!!formData.enabledModules?.includes(module.id)}
                                                        onCheckedChange={() => toggleModule(module.id)}
                                                        className="data-[state=checked]:bg-[#EF7D00] data-[state=checked]:border-[#EF7D00] data-[state=unchecked]:bg-slate-300"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Operations & Management */}
                            <div>
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-orange-600"></span>
                                    Operations & Management
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: "assets", name: "Asset Management", description: "Track council assets & equipment", icon: "🏛️" },
                                        { id: "waste", name: "Waste Management", description: "Waste collection & recycling", icon: "♻️" },
                                        { id: "procurement", name: "Procurement", description: "Purchasing & vendor management", icon: "🛒" },
                                        { id: "fleet", name: "Fleet Management", description: "Vehicle tracking & maintenance", icon: "🚗" },
                                    ].map(module => (
                                        <Card key={module.id} className="border-2 hover:border-primary transition-colors">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex gap-3 flex-1">
                                                        <div className="text-2xl">{module.icon}</div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold">{module.name}</h4>
                                                            <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        id={`module-${module.id}`}
                                                        checked={!!formData.enabledModules?.includes(module.id)}
                                                        onCheckedChange={() => toggleModule(module.id)}
                                                        className="data-[state=checked]:bg-[#EF7D00] data-[state=checked]:border-[#EF7D00] data-[state=unchecked]:bg-slate-300"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Public Engagement */}
                            <div>
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-cyan-600"></span>
                                    Public Engagement
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: "portal", name: "Public Portal", description: "Citizen self-service portal", icon: "🌐", recommended: true },
                                        { id: "mobile", name: "Mobile App", description: "Mobile application access", icon: "📱" },
                                        { id: "notifications", name: "Notifications", description: "SMS, Email & WhatsApp alerts", icon: "📧" },
                                        { id: "feedback", name: "Public Feedback", description: "Surveys & community feedback", icon: "💬" },
                                    ].map(module => (
                                        <Card key={module.id} className="border-2 hover:border-primary transition-colors">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex gap-3 flex-1">
                                                        <div className="text-2xl">{module.icon}</div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold">{module.name}</h4>
                                                                {module.recommended && (
                                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                                                        Recommended
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        id={`module-${module.id}`}
                                                        checked={!!formData.enabledModules?.includes(module.id)}
                                                        onCheckedChange={() => toggleModule(module.id)}
                                                        className="data-[state=checked]:bg-[#EF7D00] data-[state=checked]:border-[#EF7D00] data-[state=unchecked]:bg-slate-300"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Analytics & Integration */}
                            <div>
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-pink-600"></span>
                                    Analytics & Integration
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: "reports", name: "Reports & Analytics", description: "Business intelligence & dashboards", icon: "📈" },
                                        { id: "api", name: "API & Integrations", description: "Third-party integrations", icon: "🔌" },
                                        { id: "documents", name: "Document Management", description: "Digital document repository", icon: "📁" },
                                        { id: "workflows", name: "Workflow Automation", description: "Automated business processes", icon: "⚙️" },
                                    ].map(module => (
                                        <Card key={module.id} className="border-2 hover:border-primary transition-colors">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex gap-3 flex-1">
                                                        <div className="text-2xl">{module.icon}</div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold">{module.name}</h4>
                                                            <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        id={`module-${module.id}`}
                                                        checked={formData.enabledModules?.includes(module.id)}
                                                        onCheckedChange={() => toggleModule(module.id)}
                                                        className="data-[state=checked]:bg-[#EF7D00] data-[state=checked]:border-[#EF7D00] data-[state=unchecked]:bg-slate-300"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Info Banner */}
                            <div className="bg-accent-primary-dimmest border border-accent-primary-dimmer rounded-lg p-4">
                                <p className="text-sm text-accent-primary-default">
                                    <strong>💡 Tip:</strong> Disabled modules will be hidden from the navigation and inaccessible to users.
                                    You can enable them anytime as your council's needs grow.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Location Hierarchy Section */}
                <TabsContent value="location" className="space-y-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-green-600" />
                                Location Hierarchy Builder
                            </CardTitle>
                            <CardDescription>Define custom location levels for your jurisdiction</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="bg-accent-primary-dimmest border border-accent-primary-dimmer rounded-lg p-4 mb-4">
                                    <p className="text-sm text-accent-primary-default">
                                        <strong>Examples:</strong> Country → Province → District → Ward → Section → Lot<br />
                                        Or: State → County → City → Neighborhood → Block → Parcel
                                    </p>
                                </div>

                                {locationLevels.map((level, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                        <Badge variant="outline">{index + 1}</Badge>
                                        <Input
                                            id={`location-level-${index}`}
                                            value={level}
                                            onChange={(e) => updateLocationLevel(index, e.target.value)}
                                            placeholder={`Level ${index + 1}`}
                                            className="flex-1"
                                            title={`Jurisdiction Level ${index + 1}`}
                                        />
                                        {locationLevels.length > 2 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeLocationLevel(index)}
                                            >
                                                <X className="h-4 w-4 text-red-500" />
                                            </Button>
                                        )}
                                    </div>
                                ))}

                                <Button variant="outline" onClick={addLocationLevel} className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Level
                                </Button>

                                {/* Visual Hierarchy */}
                                <div className="mt-6 bg-slate-50 rounded-lg p-4">
                                    <Label className="mb-3 block">Hierarchy Preview</Label>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {locationLevels.map((level, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Badge className="bg-positive-dimmest text-positive border-positive-dimmer">
                                                    {level}
                                                </Badge>
                                                {index < locationLevels.length - 1 && (
                                                    <span className="text-muted-foreground">→</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Localization Section */}
                <TabsContent value="localization" className="space-y-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-orange-600" />
                                Regional Settings
                            </CardTitle>
                            <CardDescription>Configure date, time, currency, and regional formats</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="locale-select">Locale</Label>
                                        <Select
                                            value={formData.locale}
                                            onValueChange={(value) => setFormData({ ...formData, locale: value })}
                                        >
                                            <SelectTrigger id="locale-select">
                                                <SelectValue placeholder="Select Locale" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LOCALE_OPTIONS.map(locale => (
                                                    <SelectItem key={locale.value} value={locale.value}>
                                                        {locale.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="timezone-select">Timezone</Label>
                                        <Select
                                            value={formData.timezone}
                                            onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                                        >
                                            <SelectTrigger id="timezone-select">
                                                <SelectValue placeholder="Select Timezone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIMEZONE_OPTIONS.map(tz => (
                                                    <SelectItem key={tz.value} value={tz.value}>
                                                        {tz.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Date Format</Label>
                                        <Select
                                            value={formData.dateFormat}
                                            onValueChange={(value) => setFormData({ ...formData, dateFormat: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (19/01/2026)</SelectItem>
                                                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (01/19/2026)</SelectItem>
                                                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2026-01-19)</SelectItem>
                                                <SelectItem value="DD.MM.YYYY">DD.MM.YYYY (19.01.2026)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Time Format</Label>
                                        <Select
                                            value={formData.timeFormat}
                                            onValueChange={(value) => setFormData({ ...formData, timeFormat: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="HH:mm">24-hour (14:30)</SelectItem>
                                                <SelectItem value="hh:mm A">12-hour (02:30 PM)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    <div>
                                        <Label>Currency</Label>
                                        <Select
                                            value={formData.currency}
                                            onValueChange={(value) => {
                                                const selected = CURRENCY_OPTIONS.find(c => c.value === value);
                                                setFormData({
                                                    ...formData,
                                                    currency: value,
                                                    currencySymbol: selected?.symbol || '$'
                                                });
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CURRENCY_OPTIONS.map(curr => (
                                                    <SelectItem key={curr.value} value={curr.value}>
                                                        {curr.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Currency Display</Label>
                                        <Select
                                            value={formData.currencyPosition}
                                            onValueChange={(value) => setFormData({ ...formData, currencyPosition: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="before">Before (K 100.00)</SelectItem>
                                                <SelectItem value="after">After (100.00 K)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>First Day of Week</Label>
                                        <Select
                                            value={formData.firstDayOfWeek}
                                            onValueChange={(value) => setFormData({ ...formData, firstDayOfWeek: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monday">Monday</SelectItem>
                                                <SelectItem value="sunday">Sunday</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Live Format Preview */}
                                    <Card className="bg-slate-50 mt-6">
                                        <CardContent className="p-4 space-y-2">
                                            <Label>Format Preview</Label>
                                            <div className="text-sm space-y-1">
                                                <div><strong>Date:</strong> {formData.dateFormat.replace('YYYY', '2026').replace('MM', '01').replace('DD', '19')}</div>
                                                <div><strong>Time:</strong> {formData.timeFormat.replace('HH', '14').replace('mm', '30').replace('hh', '02').replace('A', 'PM')}</div>
                                                <div><strong>Currency:</strong> {formData.currencyPosition === 'before' ? `${formData.currencySymbol} 1,234.56` : `1,234.56 ${formData.currencySymbol}`}</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setFormData(config)}>
                    Reset Changes
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                    {isSaving ? (
                        <>
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-2" />
                            Save Configuration
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
