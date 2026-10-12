import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "../MobileLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function ApprovalQueue() {
    const [, setLocation] = useLocation();

    const { data: requests, isLoading } = useQuery<any[]>({
        queryKey: ["/api/service-requests"],
    });

    const pendingRequests = requests?.filter((r: any) =>
        ['submitted', 'processing'].includes(r.status)
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'submitted': return 'bg-blue-100 text-blue-800';
            case 'processing': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <MobileLayout title="Approval Queue" userRole="manager">
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-28 bg-gray-200 rounded-lg animate-pulse" />
                    ))}
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout title="Approval Queue" userRole="manager">
            <div className="mb-4">
                <div className="bg-[#F4C400] text-black p-3 rounded-lg">
                    <p className="text-2xl font-bold">{pendingRequests?.length || 0}</p>
                    <p className="text-sm">Pending Approvals</p>
                </div>
            </div>

            <div className="space-y-3">
                {pendingRequests?.map((request: any) => (
                    <Card
                        key={request.requestId}
                        className="p-4 active:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setLocation(`/mobile/manager/approval/${request.requestId}`)}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Building2 className="h-4 w-4 text-gray-500" />
                                    <span className="font-semibold text-sm">
                                        {request.requestRef || `REQ-${request.requestId?.slice(-6)}`}
                                    </span>
                                </div>
                                <Badge className={getStatusColor(request.status)}>
                                    {request.status}
                                </Badge>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>

                        {request.formData?.businessName && (
                            <p className="text-sm font-medium mb-1">
                                {request.formData.businessName}
                            </p>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(request.submittedAt).toLocaleDateString()}</span>
                        </div>
                    </Card>
                ))}

                {(!pendingRequests || pendingRequests.length === 0) && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No pending approvals</p>
                    </div>
                )}
            </div>
        </MobileLayout>
    );
}
