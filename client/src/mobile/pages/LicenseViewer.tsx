import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "../MobileLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LicenseViewer() {
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();

    const { data: license, isLoading } = useQuery<any>({
        queryKey: [`/api/licences/${id}`],
    });

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `License ${license?.licenceNo}`,
                    text: `My business license: ${license?.licenceNo}`,
                });
            } catch (error) {
                console.log('Share cancelled');
            }
        } else {
            toast({ title: "Sharing not supported on this device" });
        }
    };

    if (isLoading) {
        return (
            <MobileLayout title="License" userRole="business" showBack>
                <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
            </MobileLayout>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'expired': return 'bg-red-100 text-red-800';
            case 'suspended': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <MobileLayout title="License Details" userRole="business" showBack>
            <div className="space-y-4">
                {/* Digital License Card */}
                <Card className="p-6 bg-gradient-to-br from-[#F4C400] to-[#d4a800] text-black">
                    <div className="text-center mb-4">
                        <h2 className="text-2xl font-bold mb-1">{license?.licenceNo}</h2>
                        <Badge className={getStatusColor(license?.status || 'active')}>
                            {license?.status}
                        </Badge>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center mb-4">
                        <div className="bg-white p-4 rounded-lg">
                            <QRCodeSVG
                                value={`https://lgis.gov.pg/verify/${license?.licenceNo}`}
                                size={200}
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                    </div>

                    <div className="text-center text-sm">
                        <p className="font-semibold mb-1">Scan to Verify</p>
                        <p className="opacity-80">This QR code verifies license authenticity</p>
                    </div>
                </Card>

                {/* License Details */}
                <Card className="p-4">
                    <h3 className="font-semibold mb-3">License Information</h3>
                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-gray-600">License Number</p>
                            <p className="font-semibold">{license?.licenceNo}</p>
                        </div>

                        {license?.issueDate && (
                            <div>
                                <p className="text-gray-600">Issue Date</p>
                                <p className="font-semibold">
                                    {new Date(license.issueDate).toLocaleDateString()}
                                </p>
                            </div>
                        )}

                        {license?.expiryDate && (
                            <div>
                                <p className="text-gray-600">Expiry Date</p>
                                <p className="font-semibold flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(license.expiryDate).toLocaleDateString()}
                                </p>
                            </div>
                        )}

                        <div>
                            <p className="text-gray-600">Status</p>
                            <p className="font-semibold">{license?.status}</p>
                        </div>
                    </div>
                </Card>

                {/* Actions */}
                <div className="space-y-2">
                    <Button variant="outline" className="w-full" onClick={handleShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share License
                    </Button>
                    <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                    </Button>
                </div>

                {/* Expiry Warning */}
                {license?.expiryDate && (
                    (() => {
                        const daysUntilExpiry = Math.floor(
                            (new Date(license.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                        );

                        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
                            return (
                                <Card className="p-4 bg-yellow-50 border-yellow-200">
                                    <p className="text-sm font-semibold text-yellow-800 mb-1">
                                        Renewal Required Soon
                                    </p>
                                    <p className="text-sm text-yellow-700">
                                        Your license expires in {daysUntilExpiry} days. Renew now to avoid interruption.
                                    </p>
                                    <Button className="w-full mt-3 bg-yellow-600 hover:bg-yellow-700">
                                        Renew Now
                                    </Button>
                                </Card>
                            );
                        }

                        if (daysUntilExpiry <= 0) {
                            return (
                                <Card className="p-4 bg-red-50 border-red-200">
                                    <p className="text-sm font-semibold text-red-800 mb-1">
                                        License Expired
                                    </p>
                                    <p className="text-sm text-red-700">
                                        This license has expired. Renew immediately to continue operations.
                                    </p>
                                    <Button className="w-full mt-3 bg-red-600 hover:bg-red-700">
                                        Renew Now
                                    </Button>
                                </Card>
                            );
                        }

                        return null;
                    })()
                )}
            </div>
        </MobileLayout>
    );
}
