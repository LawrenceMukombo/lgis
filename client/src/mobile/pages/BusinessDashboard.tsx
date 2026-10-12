import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "../MobileLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, CreditCard, ChevronRight, QrCode } from "lucide-react";
import { useLocation } from "wouter";

export default function BusinessDashboard() {
  const [, setLocation] = useLocation();

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: requests } = useQuery<any[]>({
    queryKey: ["/api/service-requests"],
  });

  const { data: licenses } = useQuery<any[]>({
    queryKey: ["/api/licences"],
  });

  const myRequests = requests?.filter((r: any) => r.requesterType === 'business');
  const activeLicenses = licenses?.filter((l: any) => l.status === 'active');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MobileLayout title="My Business" userRole="business">
      <div className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-2xl font-bold text-green-600">{activeLicenses?.length || 0}</p>
            <p className="text-sm text-gray-600">Active Licenses</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-blue-600">{myRequests?.length || 0}</p>
            <p className="text-sm text-gray-600">Applications</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button 
              onClick={() => setLocation('/licensing/apply')}
              className="w-full justify-start bg-[#F4C400] hover:bg-[#d4a800] text-black"
            >
              <FileText className="h-4 w-4 mr-2" />
              Apply for License
            </Button>
            <Button 
              onClick={() => setLocation('/mobile/business/payments')}
              variant="outline"
              className="w-full justify-start"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              View Payments
            </Button>
          </div>
        </Card>

        {/* Active Licenses */}
        {activeLicenses && activeLicenses.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">My Licenses</h3>
            <div className="space-y-3">
              {activeLicenses.slice(0, 3).map((license: any) => (
                <Card
                  key={license.licenceId}
                  className="p-4 active:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/mobile/business/license/${license.licenceId}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1">
                        {license.licenceNo}
                      </p>
                      <Badge className={getStatusColor(license.status)}>
                        {license.status}
                      </Badge>
                    </div>
                    <QrCode className="h-8 w-8 text-gray-400" />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Expires: {new Date(license.expiryDate).toLocaleDateString()}</span>
                  </div>
                </Card>
              ))}

              {activeLicenses.length > 3 && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setLocation('/mobile/business/licenses')}
                >
                  View All Licenses
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Recent Applications */}
        {myRequests && myRequests.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Recent Applications</h3>
            <div className="space-y-3">
              {myRequests.slice(0, 3).map((request: any) => (
                <Card
                  key={request.requestId}
                  className="p-4 active:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/mobile/business/application/${request.requestId}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1">
                        {request.requestRef || `APP-${request.requestId?.slice(-6)}`}
                      </p>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(request.submittedAt).toLocaleDateString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
