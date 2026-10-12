import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Search, Filter, Download, DollarSign, TrendingUp, CreditCard, Calendar, FileText, Receipt, Send, Plus, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { MOCK_INVOICES } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ManualPaymentModal } from "@/components/finance/ManualPaymentModal";
import { OnlinePaymentModal } from "@/components/finance/OnlinePaymentModal";
import { useState, useMemo } from "react";
import { useOrganization } from "@/contexts/organization-context";

const COLORS = [
  "var(--accent-primary-default)",
  "var(--accent-positive-default)",
  "var(--accent-negative-default)",
  "var(--accent-warning-default)",
  "var(--accent-primary-dimmer)"
];

export default function RevenuePage() {
  const { currentOrganization } = useOrganization();
  const currencyCode = currentOrganization?.currencyCode || "ZMW";

  // Fetch real payments data
  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ["/api/v1/payments", currentOrganization?.councilId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/v1/payments`);
      return res.json();
    }
  });

  // Fetch real invoices data
  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["/api/v1/invoices", currentOrganization?.councilId],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/v1/invoices");
      return res.json();
    }
  });

  const isLoading = loadingPayments || loadingInvoices;

  // Calculate analytics from real data
  const analytics = useMemo(() => {
    // Debug logging
    console.log("RevenuePage Payment Data:", payments);

    if (!payments.length) return {
      totalCollected: 0,
      outstanding: 0,
      dailyAverage: 0,
      digitalPaymentRate: 0,
      monthlyRevenue: [],
      revenueBySource: [],
      recentTransactions: []
    };

    const now = new Date();
    // Allow both 'completed' and 'paid' statuses
    const completedPayments = payments.filter((p: any) =>
      ['completed', 'paid'].includes(p.status?.toLowerCase())
    );
    console.log("RevenuePage Completed Payments:", completedPayments);

    const totalCollected = completedPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);

    // Calculate outstanding (mock for now - would need invoices table integration)
    const outstanding = totalCollected * 0.3;



    // Calculate 30-day average
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const recentPayments = completedPayments.filter((p: any) => new Date(p.paidAt || p.createdAt) > thirtyDaysAgo);
    const dailyAverage = recentPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) / 30;

    // Digital payment rate
    const digitalMethods = ['bank_transfer', 'eftpos', 'mobile_money'];
    const digitalPayments = completedPayments.filter((p: any) => digitalMethods.includes(p.method?.toLowerCase()));
    const digitalPaymentRate = completedPayments.length > 0 ? (digitalPayments.length / completedPayments.length) * 100 : 0;

    // Monthly revenue (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthPayments = completedPayments.filter((p: any) => {
        const paidDate = new Date(p.paidAt || p.createdAt);
        return paidDate >= monthStart && paidDate <= monthEnd;
      });
      const amount = monthPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
      monthlyRevenue.push({
        name: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        amount: Math.round(amount)
      });
    }

    // Dynamic Revenue by source
    const sourceMap: Record<string, number> = {};
    const MAX_CATEGORIES = 5;

    completedPayments.forEach((p: any) => {
      const amount = parseFloat(p.amount || 0);
      let category = "Other";
      const ref = (p.paymentRef || "").toUpperCase();
      const desc = (p.paymentDetails?.description || "").toLowerCase();

      if (ref.startsWith("LIC") || ref.startsWith("TRD") || desc.includes("license")) category = "Licensing Fees";
      else if (ref.startsWith("PROP") || ref.startsWith("RAT") || desc.includes("rate")) category = "Property Rates";
      else if (ref.startsWith("MKT") || desc.includes("market")) category = "Market Fees";
      else if (ref.startsWith("PER") || ref.startsWith("BLD") || desc.includes("permit")) category = "Permits";
      else if (ref.startsWith("MAN")) category = "Counter Receipts";
      // Fallback: If ref is a UUID (likely a request ID), assume it's a Licensing/Application Fee
      else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)) category = "Licensing Fees";

      sourceMap[category] = (sourceMap[category] || 0) + amount;
    });

    const revenueBySource = Object.entries(sourceMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort by highest value

    // If no data, provide a placeholder so chart doesn't look broken (or empty)
    if (revenueBySource.length === 0) {
      revenueBySource.push({ name: "No Data", value: 0 });
    }

    // Format recent transactions
    const recentTransactions = completedPayments
      .slice(0, 10)
      .map((p: any) => ({
        id: p.paymentRef,
        date: new Date(p.paidAt || p.createdAt).toLocaleDateString(),
        payer: "Payment Transaction", // Would need to join with accounts/requester
        type: "License/Service Fee",
        amount: parseFloat(p.amount).toFixed(2),
        status: p.status === 'completed' ? 'Completed' : 'Pending',
        method: p.method || 'Cash'
      }));

    return {
      totalCollected,
      outstanding,
      dailyAverage,
      digitalPaymentRate,
      monthlyRevenue,
      revenueBySource,
      recentTransactions
    };
  }, [payments]);

  /* State for manual payment modal */
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOnlinePaymentModal, setShowOnlinePaymentModal] = useState(false);

  /* Helper to format large currency values */
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString(); // Fallback for small numbers
  };

  const TRANSACTIONS = analytics.recentTransactions;
  const REVENUE_BY_SOURCE = analytics.revenueBySource;
  const MONTHLY_REVENUE = analytics.monthlyRevenue;
  return (
    <MainLayout>
      <div className="gov-page-header">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">Revenue Management</h1>
          <p className="flex items-center mt-2 text-sm opacity-90">Financial overview, billing, and automated collections for {currentOrganization?.name || "the council"}.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowPaymentModal(true)} className="font-bold border-none shadow-md hover:bg-positive/90 bg-positive text-white mr-2">
            <DollarSign className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
          <Button onClick={() => setShowOnlinePaymentModal(true)} className="font-bold border-none shadow-md hover:bg-slate-700 bg-slate-800 text-white mr-2">
            <CreditCard className="mr-2 h-4 w-4" />
            Pay Online
          </Button>
          <Button variant="outline" className="border-2 font-bold hover:bg-black/90 bg-black text-[#EF7D00] border-[#EF7D00]">
            <Calendar className="mr-2 h-4 w-4 text-[#EF7D00]" />
            Fiscal Year {new Date().getFullYear()}
          </Button>
          <Button className="font-bold border-none shadow-md hover:bg-[#D46C00] bg-[#EF7D00] text-white">
            <Download className="mr-2 h-4 w-4 text-white" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Billing & Invoices</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* ... existing dashboard grid ... */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card className="shadow-sm bg-white border border-gray-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-black uppercase">Total Collected</p>
                  <DollarSign className="h-4 w-4 text-[#EF7D00]" />
                </div>
                <div className="text-2xl font-black text-[#EF7D00]">
                  {currencyCode} {isLoading ? '...' : formatCurrency(analytics.totalCollected)}
                </div>
                <p className="text-xs text-black font-medium flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1 text-[#EF7D00]" /> Real-time data
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm bg-white border border-gray-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-black uppercase">Outstanding</p>
                  <FileText className="h-4 w-4 text-[#EF7D00]" />
                </div>
                <div className="text-2xl font-black text-[#EF7D00]">
                  {currencyCode} {isLoading ? '...' : formatCurrency(analytics.outstanding)}
                </div>
                <p className="text-xs text-black font-medium mt-1">Est. arrears</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm bg-white border border-gray-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-black uppercase">Daily Average</p>
                  <Activity className="h-4 w-4 text-[#EF7D00]" />
                </div>
                <div className="text-2xl font-black text-[#EF7D00]">
                  {currencyCode} {isLoading ? '...' : formatCurrency(analytics.dailyAverage)}
                </div>
                <p className="text-xs text-black font-medium mt-1">Based on last 30 days</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm bg-white border border-gray-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-black uppercase">Digital Payments</p>
                  <CreditCard className="h-4 w-4 text-[#F4C400]" />
                </div>
                <div className="text-2xl font-black text-[#F4C400]">
                  {isLoading ? '...' : analytics.digitalPaymentRate.toFixed(0)}%
                </div>
                <p className="text-xs text-black font-medium mt-1">adoption rate</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-6">
            {/* ... existing charts ... */}
            <Card className="col-span-4 shadow-sm bg-white border border-gray-100">
              <CardHeader>
                <CardTitle className="text-[#F4C400]">Revenue Trends</CardTitle>
                <CardDescription className="text-black/70 font-medium">Monthly collection performance.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MONTHLY_REVENUE}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-dimmer)" />
                      <XAxis dataKey="name" stroke="var(--foreground-dimmer)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--foreground-dimmer)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `K${value / 1000}k`} />
                      <Tooltip
                        formatter={(value) => `${currencyCode} ${value.toLocaleString()}`}
                        contentStyle={{ borderRadius: "8px", border: "1px solid var(--outline-dimmer)", backgroundColor: "var(--background-default)", color: "var(--foreground-default)" }}
                      />
                      <Bar dataKey="amount" fill="var(--accent-primary-default)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3 shadow-sm bg-white border border-gray-100">
              <CardHeader>
                <CardTitle className="text-[#F4C400]">Sources Breakdown</CardTitle>
                <CardDescription className="text-black/70 font-medium">Revenue distribution by category.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={REVENUE_BY_SOURCE}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {REVENUE_BY_SOURCE.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${currencyCode} ${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {REVENUE_BY_SOURCE.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Invoices & Billing</CardTitle>
                  <CardDescription>Manage outgoing bills and payment requests.</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length > 0 ? (
                    invoices.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.id}</TableCell>
                        <TableCell>{inv.recipient}</TableCell>
                        <TableCell>{inv.description}</TableCell>
                        <TableCell>{inv.date}</TableCell>
                        <TableCell className="font-bold">{inv.amount}</TableCell>
                        <TableCell>
                          <Badge variant={inv.status === "Paid" ? "default" : "destructive"} className={inv.status === "Paid" ? "bg-positive text-white" : "bg-negative text-white"}>{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm"><Send className="h-4 w-4 mr-1" /> Resend</Button>
                          <Button variant="ghost" size="sm"><Receipt className="h-4 w-4 mr-1" /> View</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                        No invoices found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search receipt or payer..." className="pl-9" />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount ({currencyCode})</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TRANSACTIONS.map((trx: any) => (
                    <TableRow key={trx.id}>
                      <TableCell className="font-medium">{trx.id}</TableCell>
                      <TableCell>{trx.date}</TableCell>
                      <TableCell>{trx.payer}</TableCell>
                      <TableCell>{trx.type}</TableCell>
                      <TableCell>{trx.method}</TableCell>
                      <TableCell className="font-bold">{trx.amount}</TableCell>
                      <TableCell>
                        <Badge variant={trx.status === "Completed" ? "default" : "secondary"} className={trx.status === "Completed" ? "bg-positive text-white" : ""}>
                          {trx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ManualPaymentModal open={showPaymentModal} onOpenChange={setShowPaymentModal} />
      <OnlinePaymentModal open={showOnlinePaymentModal} onOpenChange={setShowOnlinePaymentModal} />
    </MainLayout>
  );
}

function ActivityIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
