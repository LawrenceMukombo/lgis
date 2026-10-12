import { MainLayout } from "@/components/layout/main-layout";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, YAxis } from "recharts";
import { ArrowUpRight, ArrowDownRight, Activity, Calendar, MapPin, Store, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { useLocation } from "wouter";
import { useOrganization } from "@/contexts/organization-context";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { currentOrganization } = useOrganization();
  const currencyCode = currentOrganization?.currencyCode || "ZMW";
  const councilName = currentOrganization?.name || "Lusaka City Council";

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["/api/v1/stats", currentOrganization?.councilId],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/v1/stats");
      return res.json();
    }
  });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${currencyCode} ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${currencyCode} ${(value / 1000).toFixed(1)}K`;
    return `${currencyCode} ${value.toLocaleString()}`;
  };

  const STATS_CARDS = [
    {
      title: "Total Revenue (YTD)",
      value: stats ? formatCurrency(stats.totalRevenue) : "...",
      change: "+12%", // Calculate real change if history available
      trend: "up"
    },
    {
      title: "Active Licenses",
      value: stats?.activeLicenses?.toLocaleString() || "0",
      change: "+5%",
      trend: "up"
    },
    {
      title: "Pending Inspections",
      value: stats?.pendingInspections?.toLocaleString() || "0",
      change: "-2%",
      trend: "down"
    },
    {
      title: "Citizen Requests",
      value: stats?.citizenRequests?.toLocaleString() || "0",
      change: "+8%",
      trend: "up"
    }
  ];

  if (loadingStats) {
    return (
      <MainLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <WelcomeBanner />
      <div className="flex-1 w-full flex flex-col overflow-hidden max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="gov-page-header">
          <div>
            <h1 className="text-3xl font-bold tracking-tight uppercase">{councilName} Dashboard</h1>
            <p className="flex items-center mt-2 text-sm opacity-90">
              <MapPin className="h-4 w-4 mr-1" />
              {councilName} Overview • FY {new Date().getFullYear()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="font-bold border-2 border-[#EF7D00] bg-[#0F0F0F] text-[#EF7D00] hover:bg-black/80">
              <Calendar className="mr-2 h-4 w-4" />
              Today: {new Date().toLocaleDateString()}
            </Button>
            <Button size="sm" className="bg-[#EF7D00] text-white font-bold hover:bg-[#D46C00] shadow-lg">
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {STATS_CARDS.map((stat, index) => (
          <Card
            key={index}
            className="border-2 border-card-border shadow-md hover:shadow-lg transition-all duration-200 bg-white cursor-pointer"
            onClick={() => {
              if (stat.title.includes("Revenue")) setLocation("/revenue");
              else if (stat.title.includes("Licenses")) setLocation("/licensing");
              else if (stat.title.includes("Inspections")) setLocation("/inspections");
              else if (stat.title.includes("Requests")) setLocation("/registry");
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-foreground-dimmer">{stat.title}</CardTitle>
              {stat.trend === "up" ? (
                <div className="p-1.5 rounded-full bg-accent-positive-dimmest">
                  <ArrowUpRight className="h-4 w-4 text-positive" />
                </div>
              ) : (
                <div className="p-1.5 rounded-full bg-accent-negative-dimmest">
                  <ArrowDownRight className="h-4 w-4 text-negative" />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground-default">{stat.value}</div>
              <p className="text-xs mt-2 text-foreground-dimmer">
                <span className={stat.trend === "up" ? "text-positive font-semibold" : "text-negative font-semibold"}>
                  {stat.change}
                </span>{" "}
                vs previous period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-6">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Collections</CardTitle>
            <CardDescription>
              Monthly revenue across all {councilName} divisions ({currencyCode}).
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.chartData || []}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary-default)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent-primary-default)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--foreground-dimmest)" fontSize={12} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-dimmest)" />
                  <Tooltip
                    contentStyle={{ borderRadius: "var(--border-radius-8)", border: "1px solid var(--outline-dimmer)", backgroundColor: 'var(--background-default)', color: 'var(--foreground-default)', boxShadow: "var(--shadow-lg)" }}
                    itemStyle={{ color: "var(--foreground-default)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--accent-primary-default)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Compliance by Electorate</CardTitle>
            <CardDescription>
              Registered businesses per district.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.districtData || []} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12, fill: 'var(--foreground-dimmer)' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill="var(--accent-primary-default)" radius={[0, 4, 4, 0]} barSize={30}>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 shadow-sm border-l-accent-negative-default">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-foreground-default">
              <AlertTriangle className="h-5 w-5 text-negative" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              {stats?.alerts?.length ? (
                stats.alerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 rounded-md bg-accent-negative-dimmest">
                    <div className="mt-1 h-2 w-2 rounded-full bg-accent-negative-default" />
                    <div>
                      <p className="text-sm font-medium text-foreground-default">{alert.title}</p>
                      <p className="text-xs mt-1 text-foreground-dimmer">{alert.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-foreground-dimmer italic">No critical alerts.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Licensing Activity */}
        <Card className="col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stats?.recentActivity?.length ? (
                stats.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border bg-background-higher border-outline-dimmer ${activity.type.includes('Payment') ? 'text-positive' : 'text-accent-primary-default'
                      }`}>
                      {activity.type.includes('Payment') ? <Activity className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground-default">{activity.type}</p>
                      <p className="text-xs text-foreground-dimmer">{activity.description}</p>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                      {activity.amount > 0 && (
                        <span className="text-sm font-bold text-foreground-default">{currencyCode} {Number(activity.amount).toLocaleString()}</span>
                      )}
                      <span className="text-xs text-foreground-dimmer">
                        {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-foreground-dimmer italic">No recent activity.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}


