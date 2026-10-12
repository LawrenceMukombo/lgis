import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowUpRight, RefreshCw, Database, CheckCircle2, AlertTriangle, Activity } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { IntegrationConfig } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function IntegrationsPage() {
  const queryClient = useQueryClient();

  // Fetch Integrations
  const { data: integrations = [], isLoading } = useQuery<IntegrationConfig[]>({
    queryKey: ["/api/v1/integrations"],
  });

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/v1/integrations/${id}/sync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/integrations"] });
      toast({
        title: "Sync Successful",
        description: "Integration data has been refreshed.",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Could not synchronize with the external system.",
        variant: "destructive",
      });
    }
  });

  const handleSync = (id: string, name: string) => {
    toast({
      title: "Sync Initiated",
      description: `Starting synchronization with ${name}...`,
    });
    syncMutation.mutate(id);
  };

  return (
    <MainLayout>
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 p-6 rounded-2xl shadow-lg mb-8 border border-gray-100" style={{ backgroundColor: '#FFFFFF', color: '#0F0F0F' }}>
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase" style={{ color: '#F4C400' }}>System Integrations</h2>
          <p className="font-medium" style={{ color: '#0F0F0F', opacity: 0.8 }}>Manage connections with external national and financial systems.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-2 font-bold hover:bg-black/90" style={{ backgroundColor: '#0F0F0F', color: '#F4C400', borderColor: '#F4C400' }}>
            <Activity className="mr-2 h-4 w-4" style={{ color: '#F4C400' }} />
            Connection Logs
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#F4C400]" />
        </div>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <Card key={integration.configId} className="shadow-sm bg-white border border-gray-100 hover:border-[#F4C400]/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center shrink-0">
                      <Database className="h-6 w-6 text-[#F4C400]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-black">{integration.name}</h3>
                        <Badge variant="outline" className={`border-none ${integration.status === 'Connected' ? 'bg-emerald-100 text-emerald-800' :
                            integration.status === 'Error' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {integration.status === 'Connected' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                          {integration.status === 'Error' && <AlertTriangle className="mr-1 h-3 w-3" />}
                          {integration.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> {integration.type}</span>
                        <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Last Sync: {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : 'Never'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-end">
                    <div className="flex items-center space-x-2">
                      <Switch checked={integration.status === 'Connected' || integration.status === 'Error'} className="data-[state=checked]:bg-[#EF7D00]" />
                      <span className="text-sm font-bold text-black">Enabled</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(integration.configId, integration.name)}
                      disabled={syncMutation.isPending}
                      className="border-gray-200 hover:border-[#F4C400] hover:text-[#F4C400]"
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                      {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {integrations.length === 0 && (
            <div className="text-center p-12 text-gray-500">No integrations found.</div>
          )}
        </div>
      )}
    </MainLayout>
  );
}
