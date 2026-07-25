import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTenant } from "@/providers/TenantProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, FileText, Shield, ClipboardCheck,
  AlertTriangle, Building2, CreditCard, MessageSquare, Map as MapIcon,
  Activity, Sliders, Package, ChevronRight, Leaf, Truck, Smartphone,
  Globe, Bell, ThumbsUp, BarChart3, Code2, FolderClock, Settings2,
  ChevronDown, Box, ShoppingCart
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const NAVIGATION_CATEGORIES = [
  {
    id: "core",
    name: "Core Functions",
    items: [
      { id: "dashboard", title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { id: "registry", title: "Registry", url: "/registry", icon: Users },
      { id: "licensing", title: "Licensing", url: "/licensing", icon: Shield },
      { id: "services", title: "Services", url: "/services", icon: FileText },
      { id: "payments", title: "Finance", url: "/revenue", icon: CreditCard },
    ]
  },
  {
    id: "compliance",
    name: "Compliance & Safety",
    items: [
      { id: "inspections", title: "Inspections", url: "/inspections", icon: ClipboardCheck },
      { id: "enforcement", title: "Enforcement", url: "/enforcement", icon: AlertTriangle },
      { id: "complaints", title: "Public Interaction", url: "/complaints", icon: MessageSquare },
      { id: "audit", title: "Audit & Compliance", url: "/audit", icon: Activity },
    ]
  },
  {
    id: "planning",
    name: "Planning & Development",
    items: [
      { id: "gis", title: "GIS & Mapping", url: "/gis", icon: MapIcon },
      { id: "properties", title: "Properties", url: "/properties", icon: Building2 },
      { id: "planning", title: "Planning & Zoning", url: "/planning", icon: Package },
      { id: "environment", title: "Environmental", url: "/environment", icon: Leaf },
      { id: "building", title: "Building Control", url: "/building", icon: Building2 },
    ]
  },
  {
    id: "operations",
    name: "Operations",
    items: [
      { id: "assets", title: "Asset Management", url: "/assets", icon: Building2 },
      { id: "waste", title: "Waste Management", url: "/waste", icon: Truck },
      { id: "procurement", title: "Procurement", url: "/procurement", icon: CreditCard },
      { id: "fleet", title: "Fleet Management", url: "/fleet", icon: Truck },
    ]
  },
  {
    id: "engagement",
    name: "Public Engagement",
    items: [
      { id: "portal", title: "Public Portal", url: "/portal", icon: Globe },
      { id: "mobile", title: "Mobile App", url: "/mobile", icon: Smartphone },
      { id: "notifications", title: "Notifications", url: "/notifications", icon: Bell },
      { id: "feedback", title: "Feedback", url: "/feedback", icon: ThumbsUp },
    ]
  },
  {
    id: "analytics",
    name: "Analytics & Integration",
    items: [
      { id: "reports", title: "Reports", url: "/reports", icon: BarChart3 },
      { id: "api", title: "API & Integrations", url: "/api-docs", icon: Code2 },
      { id: "documents", title: "Documents", url: "/documents", icon: FileText },
      { id: "assets", title: "Assets", url: "/assets", icon: Box },
      { id: "procurement", title: "Procurement", url: "/procurement", icon: ShoppingCart },
      { id: "workflows", title: "Workflows", url: "/workflows", icon: Settings2 },
    ]
  },
  {
    id: "system",
    name: "System",
    items: [
      { id: "configuration", title: "Configuration", url: "/configuration", icon: Sliders },
    ]
  }
];

export function Sidebar() {
  const [location] = useLocation();
  const { config } = useTenant();
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const { data: user, isLoading: isUserLoading } = useQuery<any>({ queryKey: ["/api/user"] });

  // Fallback to all modules if config is loading or empty to ensure visibility
  const enabledModules = config?.enabledModules?.length > 0 ? config.enabledModules : [
    "dashboard", "registry", "licensing", "services", "payments",
    "inspections", "enforcement", "complaints", "audit",
    "gis", "properties", "planning", "environment", "building",
    "assets", "waste", "procurement", "fleet",
    "portal", "mobile", "notifications", "feedback",
    "reports", "api", "documents", "workflows", "configuration"
  ];

  // Define allowed modules for 'user' role (Citizen/Business)
  const citizenAllowedModules = [
    "portal",      // Public Portal
    "licensing",   // My Applications
    "services",    // Services Catalog
    "notifications",
    "feedback",
    "mobile"
  ];

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  return (
    <aside
      className="hidden flex-col md:flex transition-all duration-200 ease-in-out w-sidebar bg-sidebar border-r-2 border-sidebar-border text-sidebar-foreground"
    >
      <div
        className="flex h-16 items-center gap-3 px-6 border-b-2 border-sidebar-border"
      >
        <div
          className="h-10 w-10 overflow-hidden rounded-full p-0.5 border-2 border-accent-primary-dimmer bg-background-default"
        >
          {config?.logoUrl || '/logo.png' ? (
            <img src={config.logoUrl || '/logo.png'} alt={config.shortName || 'NCDC'} className="h-full w-full object-contain" />
          ) : (
            <div
              className="h-full w-full flex items-center justify-center font-bold text-accent-primary-default bg-accent-primary-dimmest"
            >
              {config?.shortName?.substring(0, 2) || 'LG'}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
            {config?.shortName || 'NCDC'}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground opacity-70">
            Management Portal
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-6 px-3">
          {NAVIGATION_CATEGORIES.map((category) => {
            const visibleItems = category.items.filter(item =>
              item.id === "dashboard" ||
              item.id === "configuration" ||
              item.id === "registry" ||
              item.id === "licensing" ||
              item.id === "services" ||
              item.id === "payments" ||
              enabledModules.includes(item.id)
            ).filter(item => {
              // Show all modules while the user is loading or not yet resolved
              if (isUserLoading || !user) return false;

              // Staff roles — full access (roleName comes from the roles junction table)
              const staffRoles = ["admin", "administrator", "manager", "officer", "inspector"];
              const roleName = (user.roleName ?? user.role ?? "user").toLowerCase();
              const isStaff = staffRoles.some(r => roleName.includes(r));

              if (!isStaff) {
                // Citizen / public user — restricted view
                return citizenAllowedModules.includes(item.id);
              }
              return true;
            });

            if (visibleItems.length === 0) return null;

            const isCollapsed = collapsedCategories[category.id];

            return (
              <div key={category.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="flex w-full items-center justify-between px-3 py-1 mb-1 text-[11px] font-black uppercase tracking-widest transition-all group hover:bg-white/5 rounded"
                >
                  <span className="text-white/40 group-hover:text-white/90">{category.name}</span>
                  <ChevronDown className={cn("h-3 w-3 transition-transform duration-300 text-white/40 group-hover:text-white/90", isCollapsed ? "-rotate-90" : "rotate-0")} />
                </button>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden space-y-1"
                    >
                      {visibleItems.map((item) => {
                        const isActive = location === item.url || location.startsWith(item.url + "/");
                        return (
                          <Link
                            key={item.url}
                            href={item.url}
                            className={cn(
                              "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                              isActive
                                ? "bg-sidebar-item-active-bg text-sidebar-item-active-text shadow-md font-semibold"
                                : "text-sidebar-foreground hover:bg-sidebar-item-hover-bg"
                            )}
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                                isActive ? "text-sidebar-item-active-text" : "text-white/70 group-hover:text-white"
                              )}
                            />
                            <span className="flex-1">{item.title}</span>
                            {isActive && <ChevronRight className="h-3 w-3" />}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </div>

      <div
        className="p-4 border-t border-outline-dimmer bg-sidebar bg-opacity-50"
      >
        <div
          className="rounded-lg border border-outline-dimmer p-4 shadow-sm bg-background-default"
        >
          <p
            className="text-[10px] font-bold uppercase mb-1 text-accent-primary-default"
          >
            System Status
          </p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-accent-positive-dimmer"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-positive-default"></span>
            </span>
            <p className="text-xs font-medium text-foreground-default">Online & Synced</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
