import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { fetchAPI } from '@/lib/api';
import { hexToHsl, hslToHex, hexToHslComponents, getContrastColor, loadGoogleFont } from '@/lib/colors';

interface TenantConfig {
    configId: string;
    councilId: string;

    // Branding
    councilName: string;
    shortName: string;
    logoUrl?: string;
    faviconUrl?: string;
    tagline?: string;

    // Theme
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundRootColor?: string;
    backgroundDefaultColor?: string;
    backgroundHigherColor?: string;
    foregroundDefaultColor?: string;
    foregroundDimmerColor?: string;
    outlineColor?: string;

    // Advanced
    primaryForeground?: string;
    positiveColor?: string;
    warningColor?: string;
    negativeColor?: string;
    sidebarBackground?: string;
    sidebarForeground?: string;
    headerBackground?: string;
    headerForeground?: string;
    cardBackground?: string;

    // Styling
    borderRadius?: number;
    buttonRadius?: number;
    cardRadius?: number;
    inputRadius?: number;

    fontFamily: string;

    // Location
    locationLevels: string[];

    // Localization
    locale: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    firstDayOfWeek: string;

    // Currency
    currency: string;
    currencySymbol: string;
    currencyPosition: string;
    decimalSeparator: string;
    thousandsSeparator: string;

    // Contact
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    enabledModules: string[];
}

interface TenantContextValue {
    config: TenantConfig;
    isLoading: boolean;
    updateConfig: (updates: Partial<TenantConfig>) => Promise<void>;
    formatDate: (date: Date | string) => string;
    formatTime: (date: Date | string) => string;
    formatCurrency: (amount: number) => string;
    formatDateTime: (date: Date | string) => string;
}

const getStoredCouncilId = () => {
    if (typeof window === 'undefined') return 'ec9b95a7-c085-4b88-a391-e3c84d7128ce';
    const stored = localStorage.getItem('currentOrganization');
    try {
        return stored ? JSON.parse(stored)?.councilId : 'ec9b95a7-c085-4b88-a391-e3c84d7128ce';
    } catch (e) {
        return 'ec9b95a7-c085-4b88-a391-e3c84d7128ce';
    }
};

const getStoredCouncilName = () => {
    if (typeof window === 'undefined') return 'Lusaka City Council';
    const stored = localStorage.getItem('currentOrganization');
    try {
        return stored ? JSON.parse(stored)?.name : 'Lusaka City Council';
    } catch (e) {
        return 'Lusaka City Council';
    }
};

const defaultConfig: TenantConfig = {
    configId: '',
    councilId: getStoredCouncilId(),
    councilName: getStoredCouncilName(),
    shortName: 'LCC',
    primaryColor: '#0F0F0F',
    secondaryColor: '#EAB308',
    accentColor: '#F4C400',
    backgroundRootColor: '#EBECED',
    backgroundDefaultColor: '#FCFCFC',
    backgroundHigherColor: '#F0F1F2',
    foregroundDefaultColor: '#07080A',
    foregroundDimmerColor: '#3D4047',
    outlineColor: '#C0C3C4',
    positiveColor: '#10b981',
    warningColor: '#f59e0b',
    negativeColor: '#ef4444',
    borderRadius: 4,
    buttonRadius: 4,
    cardRadius: 8,
    inputRadius: 4,
    fontFamily: 'Inter',
    locationLevels: ['Country', 'Province', 'District', 'Ward'],
    locale: 'en-ZM',
    timezone: 'Africa/Lusaka',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 'monday',
    currency: 'ZMW',
    currencySymbol: 'K',
    currencyPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    enabledModules: [
        "dashboard", "registry", "licensing", "services", "payments",
        "inspections", "enforcement", "complaints", "audit",
        "gis", "properties", "planning", "environment", "building",
        "assets", "waste", "procurement", "fleet",
        "portal", "mobile", "notifications", "feedback",
        "reports", "api", "documents", "workflows", "configuration"
    ]
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const storedCouncilId = getStoredCouncilId();
    const { data: config = defaultConfig, isLoading, error } = useQuery<TenantConfig>({
        queryKey: ['/api/v1/tenant/config', storedCouncilId],
        queryFn: async () => {
            try {
                const fetched = await fetchAPI<TenantConfig>('/v1/tenant/config');
                return fetched || { ...defaultConfig, councilId: storedCouncilId };
            } catch (err) {
                console.warn('Failed to fetch tenant config, using defaults:', err);
                return {
                    ...defaultConfig,
                    councilId: storedCouncilId
                };
            }
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        retry: false, // Don't retry on failure
    });

    // Apply theme to document
    useEffect(() => {
        if (config) {
            applyTheme(config);
            applyFavicon(config);
            updateDocumentTitle(config);
        }
    }, [config]);

    // Format functions
    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return formatDateByPattern(d, config.dateFormat);
    };

    const formatTime = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return formatDateByPattern(d, config.timeFormat);
    };

    const formatDateTime = (date: Date | string) => {
        return `${formatDate(date)} ${formatTime(date)}`;
    };

    const formatCurrency = (amount: number | string | null | undefined) => {
        // Defensive check for non-numeric values
        const numericAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
        const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;

        const formatted = safeAmount.toFixed(2)
            .replace('.', config.decimalSeparator)
            .replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);

        return config.currencyPosition === 'before'
            ? `${config.currencySymbol}${formatted}`
            : `${formatted}${config.currencySymbol}`;
    };



    const updateConfig = async (updates: Partial<TenantConfig>) => {
        try {
            await fetchAPI('/v1/tenant/config', {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
            await queryClient.invalidateQueries({
                queryKey: ['/api/v1/tenant/config', storedCouncilId]
            });
        } catch (err) {
            console.error('Failed to update tenant config:', err);
            throw err;
        }
    };

    return (
        <TenantContext.Provider
            value={{
                config,
                isLoading,
                updateConfig,
                formatDate,
                formatTime,
                formatDateTime,
                formatCurrency
            }}
        >
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within TenantProvider');
    }
    return context;
}

// Helper functions
function applyTheme(config: TenantConfig) {
    const root = document.documentElement;

    // AGGRESSIVE BRANDING INJECTION (Locking these in)
    root.style.setProperty('--sidebar-background', '#0F0F0F');
    root.style.setProperty('--sidebar-foreground', '#FFFFFF');
    root.style.setProperty('--header-background', '#F4C400');
    root.style.setProperty('--header-foreground', '#000000');
    root.style.setProperty('--color-brand-primary', '#F4C400');
    root.style.setProperty('--primary', '48 100% 48%');
    root.style.setProperty('--primary-foreground', '240 6% 6%');

    const applyScale = (baseColor: string, prefix: string) => {
        const { h, s, l } = hexToHsl(baseColor);
        root.style.setProperty(`--accent-${prefix}-default`, baseColor);
        root.style.setProperty(`--accent-${prefix}-stronger`, hslToHex(h, s, Math.max(0, l - 15)));
        root.style.setProperty(`--accent-${prefix}-strongest`, hslToHex(h, s, Math.max(0, l - 30)));
        root.style.setProperty(`--accent-${prefix}-dimmer`, hslToHex(h, s, Math.min(100, l + 20)));
        root.style.setProperty(`--accent-${prefix}-dimmest`, hslToHex(h, s, Math.min(100, l + 40)));
    };

    // 1. Primary Scale
    applyScale(config.primaryColor, 'primary');
    root.style.setProperty('--color-primary', config.primaryColor);

    // 2. Positive Scale
    const positiveBase = config.positiveColor || config.secondaryColor || '#10b981';
    applyScale(positiveBase, 'positive');
    root.style.setProperty('--color-secondary', positiveBase);

    // 3. Warning Scale
    const warningBase = config.warningColor || config.accentColor || '#f59e0b';
    applyScale(warningBase, 'warning');

    // 4. Negative Scale
    const negativeBase = config.negativeColor || '#ef4444';
    applyScale(negativeBase, 'negative');

    // 5. Manual Overrides for Canvas & Layering
    if (config.backgroundRootColor) root.style.setProperty('--background-root', config.backgroundRootColor);
    if (config.backgroundDefaultColor) root.style.setProperty('--background-default', config.backgroundDefaultColor);
    if (config.backgroundHigherColor) root.style.setProperty('--background-higher', config.backgroundHigherColor);

    // Automatically derive highest from higher if not provided
    if (config.backgroundHigherColor) {
        const higherHsl = hexToHsl(config.backgroundHigherColor);
        root.style.setProperty('--background-highest', hslToHex(higherHsl.h, higherHsl.s, Math.max(0, higherHsl.l - 5)));
    }

    if (config.foregroundDefaultColor) root.style.setProperty('--foreground-default', config.foregroundDefaultColor);
    if (config.foregroundDimmerColor) root.style.setProperty('--foreground-dimmer', config.foregroundDimmerColor);

    // Automatically derive dimmest from dimmer if not provided
    if (config.foregroundDimmerColor) {
        const dimmerHsl = hexToHsl(config.foregroundDimmerColor);
        root.style.setProperty('--foreground-dimmest', hslToHex(dimmerHsl.h, dimmerHsl.s, Math.min(100, dimmerHsl.l + 15)));
    }

    if (config.outlineColor) root.style.setProperty('--outline-dimmer', config.outlineColor);

    // 6. Surface Overrides
    if (config.sidebarBackground) root.style.setProperty('--sidebar-background', config.sidebarBackground);
    if (config.sidebarForeground) root.style.setProperty('--sidebar-foreground', config.sidebarForeground);
    if (config.headerBackground) root.style.setProperty('--header-background', config.headerBackground);
    if (config.headerForeground) root.style.setProperty('--header-foreground', config.headerForeground);
    if (config.cardBackground) root.style.setProperty('--card-background', config.cardBackground);

    // 7. Styling Overrides
    if (config.borderRadius !== undefined) {
        root.style.setProperty('--border-radius-global', `${config.borderRadius}px`);
        // For shadcn radius
        root.style.setProperty('--radius', `${config.borderRadius / 8}rem`);
    }
    if (config.buttonRadius !== undefined) root.style.setProperty('--border-radius-button', `${config.buttonRadius}px`);
    if (config.cardRadius !== undefined) root.style.setProperty('--border-radius-card', `${config.cardRadius}px`);
    if (config.inputRadius !== undefined) root.style.setProperty('--border-radius-input', `${config.inputRadius}px`);

    // 7. Apply font
    root.style.setProperty('--font-family', config.fontFamily);
    root.style.setProperty('--font-family-default', `"${config.fontFamily}", "IBM Plex Sans", system-ui, sans-serif`);
    document.body.style.fontFamily = `"${config.fontFamily}", "IBM Plex Sans", sans-serif`;

    // Load Google Font if needed
    if (config.fontFamily !== 'Inter' && config.fontFamily !== 'system-ui' && config.fontFamily !== 'IBM Plex Sans') {
        loadGoogleFont(config.fontFamily);
    }

    // 8. Dynamic Application of Standard/Legacy Tokens
    const primaryHsl = hexToHsl(config.primaryColor);
    const primaryForegroundHex = getContrastColor(config.primaryColor);

    // NCDC Theme Detection: Black/Dark primary background often means yellow text
    const isNCDCDark = (config.primaryColor.toLowerCase() === '#000000' || config.primaryColor.toLowerCase() === '#1a1a1a' || config.primaryColor.toLowerCase() === '#07080a');

    // Yellow Theme Detection: Bright yellow secondary/primary often means black text
    const isYellowTheme = (config.primaryColor.toLowerCase() === '#f4c400' || config.secondaryColor?.toLowerCase() === '#f4c400' || (primaryHsl.h > 45 && primaryHsl.h < 65 && primaryHsl.l > 40));

    // Compatibility with Tailwind and Shadcn
    root.style.setProperty('--primary', `${Math.round(primaryHsl.h)} ${Math.round(primaryHsl.s)}% ${Math.round(primaryHsl.l)}%`);

    // Priority: NCDC YELLOW (on Dark) > MANUAL DEFAULT TEXT > AUTOMATIC CONTRAST
    let pForeground = hexToHslComponents(primaryForegroundHex);

    if (isNCDCDark) {
        pForeground = '52 100% 50%'; // Brand Yellow text on Black primary
    } else if (isYellowTheme) {
        pForeground = '240 6% 6%'; // Hard Black text on Yellow primary
    }

    // Manual overrides always take final priority
    if (config.primaryForeground && config.primaryForeground.startsWith('#')) {
        pForeground = hexToHslComponents(config.primaryForeground);
    } else if (config.primaryForeground) {
        // Assume it's already an HSL component string
        pForeground = config.primaryForeground;
    } else if (config.foregroundDefaultColor && !isYellowTheme && config.foregroundDefaultColor.startsWith('#')) {
        pForeground = hexToHslComponents(config.foregroundDefaultColor);
    }

    root.style.setProperty('--primary-foreground', pForeground);
    root.style.setProperty('--destructive-foreground', '0 0% 100%');

    // ============================================================================
    // ENFORCE GOLD, BLACK & WHITE THEME (Always Applied Last to Override Defaults)
    // ============================================================================

    // Force gold/black/white color scheme
    root.style.setProperty('--color-brand-primary', '#F4C400');
    root.style.setProperty('--color-brand-primary-hover', '#DDB200');
    root.style.setProperty('--color-brand-primary-active', '#C29F00');

    // Override Tailwind's primary colors for buttons
    // Gold: hsl(48, 100%, 48%) = #F4C400
    root.style.setProperty('--primary', '48 100% 48%');  // GOLD for buttons
    root.style.setProperty('--primary-foreground', '240 6% 6%');  // BLACK text (almost black)

    // Success Color (DARK GREEN)
    root.style.setProperty('--color-status-success', '#0D7A2C');
    root.style.setProperty('--accent-positive-default', '#0D7A2C');
    root.style.setProperty('--accent-positive-dimmer', '#16A34A');
    root.style.setProperty('--accent-positive-dimmest', '#E6F4EA');

    // Sidebar (Black with White text, Gold active)
    root.style.setProperty('--header-background', '#0F0F0F');
    root.style.setProperty('--header-foreground', '#F4C400');
    root.style.setProperty('--sidebar-background', '#0F0F0F');
    root.style.setProperty('--sidebar-foreground', '#FFFFFF');
    root.style.setProperty('--sidebar-item-active-bg', '#F4C400');
    root.style.setProperty('--sidebar-item-active-text', '#0F0F0F');
    root.style.setProperty('--sidebar-item-hover-bg', '#1C1C1C');
    root.style.setProperty('--sidebar-item-inactive-text', '#FFFFFF');
    root.style.setProperty('--sidebar-icon-active', '#F4C400');
    root.style.setProperty('--sidebar-icon-inactive', '#FFFFFF');
    root.style.setProperty('--sidebar-border', '#F4C400');

    // Page Headers (GOLD background, BLACK text)
    root.style.setProperty('--header-background', '#F4C400');
    root.style.setProperty('--header-foreground', '#0F0F0F');
    root.style.setProperty('--header-border', '#DDB200');
    root.style.setProperty('--header-utility-icon', '#F4C400');  // GOLD icons in header

    // Page Background (Light Yellow)
    root.style.setProperty('--background-root', '#FFF2B2');
    root.style.setProperty('--background-default', '#FFFFFF');
    root.style.setProperty('--background-higher', '#FFFEF7');
    root.style.setProperty('--background-highest', '#F4C400');

    // Cards (White with GOLD borders)
    root.style.setProperty('--card-background', '#FFFFFF');
    root.style.setProperty('--card-border', '#F4C400');
    root.style.setProperty('--card-title-text', '#0F0F0F');
    root.style.setProperty('--card-metadata-text', '#6B6B6B');

    // Buttons (GOLD TEXT on black backgrounds)
    root.style.setProperty('--btn-primary-bg', '#F4C400');
    root.style.setProperty('--btn-primary-text', '#0F0F0F');
    root.style.setProperty('--btn-primary-hover', '#DDB200');
    root.style.setProperty('--btn-secondary-bg', '#0F0F0F');
    root.style.setProperty('--btn-secondary-text', '#F4C400');  // GOLD TEXT
    root.style.setProperty('--btn-secondary-border', '#F4C400');
    root.style.setProperty('--btn-success-bg', '#0D7A2C');  // DARK GREEN
    root.style.setProperty('--btn-success-text', '#FFFFFF');
    root.style.setProperty('--btn-success-hover', '#0A5F22');

    // ALL ICONS ARE GOLD
    root.style.setProperty('--icon-color-default', '#F4C400');  // Default icon color
    root.style.setProperty('--icon-color-hover', '#DDB200');    // Icon hover
    root.style.setProperty('--icon-color-active', '#F4C400');   // Active icons

    // Status Badges
    root.style.setProperty('--badge-approved-bg', '#0D7A2C');  // DARK GREEN
    root.style.setProperty('--badge-approved-text', '#FFFFFF');
    root.style.setProperty('--badge-pending-bg', '#F4C400');
    root.style.setProperty('--badge-pending-text', '#0F0F0F');
    root.style.setProperty('--badge-draft-bg', '#0F0F0F');
    root.style.setProperty('--badge-draft-text', '#F4C400');  // GOLD TEXT

    // Accent colors (keep gold theme)
    root.style.setProperty('--accent-primary-default', '#F4C400');
    root.style.setProperty('--accent-primary-dimmer', '#FFE066');
    root.style.setProperty('--accent-primary-dimmest', '#FFF2B2');
    root.style.setProperty('--accent-primary-stronger', '#DDB200');
    root.style.setProperty('--accent-primary-strongest', '#C29F00');
}

function applyFavicon(config: TenantConfig) {
    if (config.logoUrl) {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (link) {
            link.href = config.logoUrl;
        }
    }
}

function updateDocumentTitle(config: TenantConfig) {
    document.title = `${config.shortName} - Local Government Information System`;
}

function formatDateByPattern(date: Date, pattern: string): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return pattern
        .replace('DD', day)
        .replace('MM', month)
        .replace('YYYY', String(year))
        .replace('YY', String(year).slice(-2))
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}
