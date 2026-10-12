import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FieldPolicyMatrix } from "@/components/security/FieldPolicyMatrix";
import { BreakGlassWorkflow } from "@/components/security/BreakGlassWorkflow";
import { UserManagement } from "@/components/admin/UserManagement";
import { TenantConfigTab } from "@/components/admin/TenantConfigTab";
import { ServiceCatalogueTab } from "@/components/admin/ServiceCatalogueTab";
import { LicenseFeeManagement } from "@/components/admin/LicenseFeeManagement";
import { WorkflowManagement } from "@/components/admin/WorkflowManagement";
import { PermissionManagement } from "@/components/admin/PermissionManagement";
import { LicenseRequirementsTab } from "@/components/admin/LicenseRequirementsTab";
import { CountryCouncilOnboarding } from "@/components/admin/CountryCouncilOnboarding";
import { BoundaryManagement } from "@/components/admin/BoundaryManagement";
import { Save, Upload, Plus, Database, ArrowRight, Shield, Lock, AlertTriangle, DollarSign, FileCheck, Globe, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function ConfigurationPage() {
  const [, setLocation] = useLocation();

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Configuration changes have been applied.",
    });
  };

  return (
    <MainLayout>
      <div className="gov-page-header">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight">System Configuration</h1>
          <p className="flex items-center mt-2 text-sm opacity-90">Manage organization profile, users, security & permissions.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setLocation("/integrations")} className="hover:bg-black/5">
            <Database className="mr-2 h-4 w-4 text-primary" />
            Integrations
          </Button>
          <Button onClick={handleSave} className="btn-primary">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 bg-transparent h-auto p-0 justify-start w-full">
          {[
            { value: 'organization', label: 'Organization & Tenant' },
            { value: 'countries', label: 'Countries & Councils', icon: Globe },
            { value: 'boundaries', label: 'Boundaries & GIS', icon: MapPin },
            { value: 'services', label: 'Service Catalogue' },
            { value: 'workflows', label: 'Workflows & Rules' },
            { value: 'notifications', label: 'Notifications' },
            { value: 'license-requirements', label: 'Licence Requirements', icon: FileCheck },
            { value: 'license-fees', label: 'Licence Fees', icon: DollarSign },
            { value: 'users', label: 'User Management' },
            { value: 'permissions', label: 'Permissions', icon: Shield },
            { value: 'field-policies', label: 'Field Policies', icon: Lock },
            { value: 'break-glass', label: 'Break-Glass', icon: AlertTriangle }
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="h-10 px-4 border-2 border-foreground/10 data-[state=active]:bg-[#0F0F0F] data-[state=active]:text-[#F4C400] data-[state=active]:border-[#0F0F0F] bg-[#FEF7E0] text-foreground font-bold uppercase tracking-widest transition-all rounded-lg shadow-sm hover:translate-y-[-1px] hover:shadow-md flex items-center gap-2 text-[11px]"
            >
              {tab.icon && <tab.icon className="h-3 w-3" />}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Organization & Tenant Tab */}
        <TabsContent value="organization">
          <TenantConfigTab />
        </TabsContent>

        {/* Countries & Councils Tab */}
        <TabsContent value="countries">
          <CountryCouncilOnboarding />
        </TabsContent>

        {/* Administrative Boundaries & GIS Tab */}
        <TabsContent value="boundaries">
          <BoundaryManagement />
        </TabsContent>

        {/* Service Catalogue Tab */}
        <TabsContent value="services">
          <ServiceCatalogueTab />
        </TabsContent>

        {/* Workflows & Rules Tab */}
        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle>Workflow & Rule Engine</CardTitle>
              <CardDescription>Define approval chains, automatic routing, and validation rules.</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowManagement />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>Manage SMS and Email alerts for system events.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { event: "Application Received", channels: ["Email", "SMS"], active: true },
                  { event: "Payment Confirmation", channels: ["Email", "SMS"], active: true },
                  { event: "Inspection Scheduled", channels: ["Email"], active: true },
                  { event: "License Renewal Reminder", channels: ["Email", "SMS", "WhatsApp"], active: false },
                ].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-background-higher border-outline-dimmer">
                    <div>
                      <div className="font-medium text-foreground-default">{notif.event}</div>
                      <div className="text-xs text-foreground-dimmer">Channels: {notif.channels.join(", ")}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch checked={notif.active} />
                        <Label className="text-xs">Active</Label>
                      </div>
                      <Button variant="ghost" size="sm">Edit Template</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Licence Requirements Tab */}
        <TabsContent value="license-requirements">
          <LicenseRequirementsTab />
        </TabsContent>

        {/* Licence Fees Tab */}
        <TabsContent value="license-fees">
          <LicenseFeeManagement />
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader className="border-b border-outline-dimmer bg-background-higher/30">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent-primary-default" />
                Permission Management
              </CardTitle>
              <CardDescription className="text-foreground-dimmer">
                Configure granular permissions across all 9 LGIS modules with 78+ permission codes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <PermissionManagement />
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW: Field Policies Tab */}
        <TabsContent value="field-policies">
          <FieldPolicyMatrix />
        </TabsContent>

        {/* NEW: Break-Glass Tab */}
        <TabsContent value="break-glass">
          <BreakGlassWorkflow />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
