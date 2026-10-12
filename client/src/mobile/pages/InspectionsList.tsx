import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "../MobileLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function InspectionsList() {
    const [, setLocation] = useLocation();

    const { data: inspections, isLoading } = useQuery<any[]>({
        queryKey: ["/api/inspections"],
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <MobileLayout title="My Inspections" userRole="inspector">
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
                    ))}
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout title="My Inspections" userRole="inspector">
            <div className="space-y-3">
                {inspections?.map((inspection: any) => (
                    <Card
                        key={inspection.inspectionId}
                        className="p-4 active:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setLocation(`/mobile/inspector/inspection/${inspection.inspectionId}`)}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm mb-1">
                                    Inspection #{inspection.inspectionId?.slice(-6)}
                                </h3>
                                <Badge className={getStatusColor(inspection.status || 'scheduled')}>
                                    {inspection.status || 'Scheduled'}
                                </Badge>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                            {inspection.scheduledAt && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(inspection.scheduledAt).toLocaleDateString()}</span>
                                    <Clock className="h-4 w-4 ml-2" />
                                    <span>{new Date(inspection.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            )}

                            {(inspection.latitude && inspection.longitude) && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span className="truncate">
                                        {inspection.latitude}, {inspection.longitude}
                                    </span>
                                </div>
                            )}
                        </div>

                        {inspection.remarks && (
                            <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                                {inspection.remarks}
                            </p>
                        )}
                    </Card>
                ))}

                {(!inspections || inspections.length === 0) && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No inspections assigned</p>
                    </div>
                )}
            </div>
        </MobileLayout>
    );
}
