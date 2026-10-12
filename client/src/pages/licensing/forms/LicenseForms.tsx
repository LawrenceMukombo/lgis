import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    barberShopSchema,
    dinnerSpecialPermitSchema,
    cabaretPermitSchema,
    clubLicenseSchema,
    publicansLicenseSchema,
    tradeLicenseSchema,
    storekeeperSchema,
    secondHandDealerSchema,
    restaurantLicenseSchema,
    bottleShopSchema,
    electronicShopSchema
} from "./schemas";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";

interface FormProps<T> {
    onSubmit: (data: T) => void;
    isSubmitting: boolean;
    defaultValues?: Partial<T>;
    licenseTypeName?: string;
    business?: any;
}

// Helper to generate options 01-99
const numberOptions = Array.from({ length: 99 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
);

// Navigation Component
const FormNav = ({
    activeTab,
    tabs,
    onTabChange,
    isSubmitting,
    isLastTab
}: {
    activeTab: string;
    tabs: string[];
    onTabChange: (tab: string) => void;
    isSubmitting: boolean;
    isLastTab: boolean;
}) => {
    const currentIndex = tabs.indexOf(activeTab);
    const handleNext = () => {
        if (currentIndex < tabs.length - 1) {
            onTabChange(tabs[currentIndex + 1]);
        }
    };
    const handleBack = () => {
        if (currentIndex > 0) {
            onTabChange(tabs[currentIndex - 1]);
        }
    };

    return (
        <div className="flex justify-between pt-6 border-t mt-6">
            <Button type="button" variant="outline" onClick={handleBack} disabled={currentIndex === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {isLastTab ? (
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </Button>
            ) : (
                <Button type="button" onClick={handleNext}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
    );
};

const AddressFields = ({ control, namePrefix, business }: { control: any; namePrefix: string; business?: any }) => (
    <>
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={control}
                name={`${namePrefix}.section`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Section</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!!business}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[200px] overflow-y-auto">
                                {numberOptions.map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name={`${namePrefix}.lot`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Lot / Allotment</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!!business}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[200px] overflow-y-auto">
                                {numberOptions.map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
            control={control}
            name={`${namePrefix}.suburb`}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Suburb</FormLabel>
                    <FormControl><Input {...field} disabled={!!business} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={control}
                name={`${namePrefix}.block`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Block</FormLabel>
                        <FormControl><Input {...field} disabled={!!business} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name={`${namePrefix}.village`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Village / LLG</FormLabel>
                        <FormControl><Input {...field} disabled={!!business} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
            control={control}
            name={`${namePrefix}.detail`}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Address Detail</FormLabel>
                    <FormControl><Input {...field} placeholder="Additional address details" disabled={!!business} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    </>
);

export function BarberShopForm({ onSubmit, isSubmitting, defaultValues, licenseTypeName, business }: FormProps<z.infer<typeof barberShopSchema>>) {
    const [activeTab, setActiveTab] = useState("details");
    const tabs = ["details", "premises", "equipment"];

    const form = useForm<z.infer<typeof barberShopSchema>>({
        resolver: zodResolver(barberShopSchema),
        defaultValues: defaultValues || {
            numberOfBarbers: 0,
            numberOfChairs: 0,
            numberOfWashBasins: 0,
            customerGender: "both",
            applicantName: "",
            premisesAddress: { section: "", lot: "", suburb: "", block: "", village: "", detail: "" },
            floorSpace: "",
            hotWaterSupply: "",
            ladiesHairDryers: 0,
            wavingMachines: 0
        }
    });

    useEffect(() => {
        if (business) {
            form.setValue("applicantName", business.legalName || business.tradingName || "");
            form.setValue("premisesAddress.section", business.section || "");
            form.setValue("premisesAddress.lot", business.lot || "");
            form.setValue("premisesAddress.suburb", business.suburb || "");
            form.setValue("premisesAddress.block", business.block || "");
            form.setValue("premisesAddress.village", business.village || "");
            form.setValue("premisesAddress.detail", business.physicalAddress || "");
        }
    }, [business, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Applicant</TabsTrigger>
                        <TabsTrigger value="premises">Premises</TabsTrigger>
                        <TabsTrigger value="equipment">Equipment</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 py-4 min-h-[300px]">
                        {licenseTypeName && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Type</label>
                                <Input value={licenseTypeName} disabled className="bg-muted" />
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="applicantName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name of Applicant (in full)</FormLabel>
                                    <FormControl><Input {...field} disabled={!!business} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </TabsContent>

                    <TabsContent value="premises" className="space-y-4 py-4 min-h-[300px]">
                        <AddressFields control={form.control} namePrefix="premisesAddress" business={business} />
                        <FormField
                            control={form.control}
                            name="floorSpace"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Floor Space of Premises</FormLabel>
                                    <FormControl><Input {...field} placeholder="e.g. 50 sqm" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </TabsContent>

                    <TabsContent value="equipment" className="space-y-4 py-4 min-h-[300px]">
                        <FormField
                            control={form.control}
                            name="numberOfBarbers"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Barbers</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="numberOfChairs"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Chairs</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="numberOfWashBasins"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Wash Basins</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="hotWaterSupply"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Hot Water Supply Details</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="customerGender"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Intended to cater for?</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ladies">Ladies</SelectItem>
                                            <SelectItem value="gentlemen">Gentlemen</SelectItem>
                                            <SelectItem value="both">Both</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {(form.watch("customerGender") === "ladies" || form.watch("customerGender") === "both") && (
                            <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
                                <FormField
                                    control={form.control}
                                    name="ladiesHairDryers"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>No. of Hair Dryers</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="wavingMachines"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>No. of Waving Machines</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <FormNav
                    activeTab={activeTab}
                    tabs={tabs}
                    onTabChange={setActiveTab}
                    isSubmitting={isSubmitting}
                    isLastTab={activeTab === tabs[tabs.length - 1]}
                />
            </form>
        </Form>
    );
}

export function DinnerSpecialPermitForm({ onSubmit, isSubmitting, defaultValues, licenseTypeName, business }: FormProps<z.infer<typeof dinnerSpecialPermitSchema>>) {
    const form = useForm<z.infer<typeof dinnerSpecialPermitSchema>>({
        resolver: zodResolver(dinnerSpecialPermitSchema),
        defaultValues: defaultValues || {
            applicantName: "",
            companyName: "",
            premisesAddress: { section: "", lot: "", suburb: "", block: "", village: "", detail: "" },
            premisesName: "",
            occasionDate: "",
            startTime: "",
            endTime: "",
            occasionPurpose: "",
            companyNumber: "",
            nationality: ""
        }
    });

    useEffect(() => {
        if (business) {
            form.setValue("applicantName", business.legalName || business.ownerName || "");
            form.setValue("companyName", business.tradingName || business.legalName || "");
            form.setValue("premisesAddress.section", business.section || "");
            form.setValue("premisesAddress.lot", business.lot || "");
            form.setValue("premisesAddress.suburb", business.suburb || "");
            form.setValue("premisesAddress.block", business.block || "");
            form.setValue("premisesAddress.village", business.village || "");
            form.setValue("premisesAddress.detail", business.physicalAddress || "");
        }
    }, [business, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    {licenseTypeName && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Type</label>
                            <Input value={licenseTypeName} disabled className="bg-muted" />
                        </div>
                    )}
                    <FormField
                        control={form.control}
                        name="applicantName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Applicant Name</FormLabel>
                                <FormControl><Input {...field} disabled={!!business} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Company & Business Name</FormLabel>
                                <FormControl><Input {...field} disabled={!!business} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <AddressFields control={form.control} namePrefix="premisesAddress" business={business} />
                    <FormField
                        control={form.control}
                        name="companyNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Company Number (if applicable)</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nationality</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="premisesName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unlicensed Premise Name / Known As</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="occasionDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date of Occasion</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Time</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Time</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="occasionPurpose"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Purpose of Occasion</FormLabel>
                                <FormControl><Textarea {...field} placeholder="Explain briefly..." /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </Button>
            </form>
        </Form>
    );
}

export function CabaretPermitForm({ onSubmit, isSubmitting, defaultValues, licenseTypeName, business }: FormProps<z.infer<typeof cabaretPermitSchema>>) {
    const form = useForm<z.infer<typeof cabaretPermitSchema>>({
        resolver: zodResolver(cabaretPermitSchema),
        defaultValues: defaultValues || {
            applicantName: "",
            premisesAddress: { section: "", lot: "", suburb: "", block: "", village: "", detail: "" },
            premisesName: "",
            areaDescription: ""
        }
    });

    useEffect(() => {
        if (business) {
            form.setValue("applicantName", business.legalName || "");
            form.setValue("premisesAddress.section", business.section || "");
            form.setValue("premisesAddress.lot", business.lot || "");
            form.setValue("premisesAddress.suburb", business.suburb || "");
            form.setValue("premisesAddress.block", business.block || "");
            form.setValue("premisesAddress.village", business.village || "");
            form.setValue("premisesAddress.detail", business.physicalAddress || "");
            form.setValue("premisesName", business.tradingName || business.legalName || "");
        }
    }, [business, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {licenseTypeName && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Type</label>
                        <Input value={licenseTypeName} disabled className="bg-muted" />
                    </div>
                )}
                <FormField
                    control={form.control}
                    name="applicantName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Applicant / Licensee Name</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="currentLicenseType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Current License Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select current holder type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="publican">Publican License</SelectItem>
                                    <SelectItem value="restaurant">Restaurant License</SelectItem>
                                    <SelectItem value="tavern">Tavern License</SelectItem>
                                    <SelectItem value="limited_hotel">Limited Hotel License</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <AddressFields control={form.control} namePrefix="premisesAddress" business={business} />
                <FormField
                    control={form.control}
                    name="premisesName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Known As</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="areaDescription"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Area for Cabaret (Description)</FormLabel>
                            <FormControl><Textarea {...field} placeholder="Portion of the described licensed premises..." /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </Button>
            </form>
        </Form>
    );
}

export function ClubLicenseForm({ onSubmit, isSubmitting, defaultValues, licenseTypeName, business }: FormProps<z.infer<typeof clubLicenseSchema>>) {
    const [activeTab, setActiveTab] = useState("details");
    const clientTabs = ["details", "attachments"];
    const allTabs = ["details", "attachments", "office_use"];

    const form = useForm<z.infer<typeof clubLicenseSchema>>({
        resolver: zodResolver(clubLicenseSchema),
        defaultValues: defaultValues || {
            clubName: "",
            applicantName: "",
            premisesAddress: { section: "", lot: "", suburb: "", block: "", village: "", detail: "" },
            knownAs: "",
            tradingHours: { from: "", to: "" },
            numberOfMembers: 0,
            attachments: { namesList: undefined, constitution: undefined, resolution: undefined },
            officeUseOnly: {
                applicationProcessing: { dateOfPayment: "", officialRecNo: "", adminFee: "" },
                licenseProcessing: { dateOfPayment: "", licenseFee: "", officialRecNo: "", approvedRejected: "Approved", meetingNo: "", date: "", licenseNo: "" }
            }
        }
    });

    useEffect(() => {
        if (business) {
            form.setValue("clubName", business.legalName || business.tradingName || "");
            form.setValue("applicantName", business.ownerName || "");
            form.setValue("premisesAddress.section", business.section || "");
            form.setValue("premisesAddress.lot", business.lot || "");
            form.setValue("premisesAddress.suburb", business.suburb || "");
            form.setValue("premisesAddress.block", business.block || "");
            form.setValue("premisesAddress.village", business.village || "");
            form.setValue("premisesAddress.detail", business.physicalAddress || "");
            form.setValue("knownAs", business.tradingName || "");
        }
    }, [business, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Club Details</TabsTrigger>
                        <TabsTrigger value="attachments">Attachments</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="space-y-4 py-4 min-h-[300px]">
                        {licenseTypeName && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Type</label>
                                <Input value={licenseTypeName} disabled className="bg-muted" />
                            </div>
                        )}
                        <FormField
                            control={form.control}
                            name="clubName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name of Club</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="applicantName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Applicant Name</FormLabel>
                                    <FormControl><Input {...field} placeholder="e.g. John Doe, Secretary" disabled={!!business} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <AddressFields control={form.control} namePrefix="premisesAddress" business={business} />
                        <FormField
                            control={form.control}
                            name="knownAs"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Known As</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tradingHours.from"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Proposed Trading Hours From</FormLabel>
                                        <FormControl><Input type="time" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tradingHours.to"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>To</FormLabel>
                                        <FormControl><Input type="time" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="numberOfMembers"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Financial Members (&gt;18)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </TabsContent>
                    <TabsContent value="attachments" className="space-y-4 py-4 min-h-[300px]">
                        <div className="border p-4 rounded-md space-y-4">
                            <FormField
                                control={form.control}
                                name="attachments.namesList"
                                render={({ field: { value, onChange, ...fieldProps } }) => (
                                    <FormItem>
                                        <FormLabel>List of names of all members</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...fieldProps}
                                                type="file"
                                                accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(event) => {
                                                    onChange(event.target.files && event.target.files[0]);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="attachments.constitution"
                                render={({ field: { value, onChange, ...fieldProps } }) => (
                                    <FormItem>
                                        <FormLabel>Copy of Club Rules / Constitution</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...fieldProps}
                                                type="file"
                                                accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(event) => {
                                                    onChange(event.target.files && event.target.files[0]);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="attachments.resolution"
                                render={({ field: { value, onChange, ...fieldProps } }) => (
                                    <FormItem>
                                        <FormLabel>Copy of Resolution (under s62(1))</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...fieldProps}
                                                type="file"
                                                accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(event) => {
                                                    onChange(event.target.files && event.target.files[0]);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>
                    <TabsContent value="office_use" className="space-y-4 py-4 min-h-[300px] hidden">
                        <div className="border p-4 rounded-md space-y-4">
                            <h3 className="font-semibold">Application Processing</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="officeUseOnly.applicationProcessing.dateOfPayment"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date of Payment</FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="officeUseOnly.applicationProcessing.officialRecNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Official Receipt No.</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="officeUseOnly.applicationProcessing.adminFee"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Admin Fee</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="border p-4 rounded-md space-y-4">
                            <h3 className="font-semibold">License Processing</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="officeUseOnly.licenseProcessing.dateOfPayment"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date of Payment</FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="officeUseOnly.licenseProcessing.licenseFee"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>License Fee</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="officeUseOnly.licenseProcessing.officialRecNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Official Receipt No.</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="officeUseOnly.licenseProcessing.approvedRejected"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Approved / Rejected</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Approved">Approved</SelectItem>
                                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="officeUseOnly.licenseProcessing.meetingNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Meeting No.</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="officeUseOnly.licenseProcessing.date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date</FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="officeUseOnly.licenseProcessing.licenseNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>License No.</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <FormNav
                    activeTab={activeTab}
                    tabs={clientTabs}
                    onTabChange={setActiveTab}
                    isSubmitting={isSubmitting}
                    isLastTab={activeTab === clientTabs[clientTabs.length - 1]}
                />
            </form>
        </Form>
    );
}

export function PublicansLicenseForm({ onSubmit, isSubmitting, defaultValues, licenseTypeName, business }: FormProps<z.infer<typeof publicansLicenseSchema>>) {
    const form = useForm<z.infer<typeof publicansLicenseSchema>>({
        resolver: zodResolver(publicansLicenseSchema),
        defaultValues: defaultValues || {
            applicantName: "",
            licenseType: "publicans",
            premisesAddress: { section: "", lot: "", suburb: "", block: "", village: "", detail: "" },
            premisesName: "",
            intentionToApply: ""
        }
    });

    useEffect(() => {
        if (business) {
            form.setValue("applicantName", business.legalName || "");
            form.setValue("premisesName", business.tradingName || business.legalName || "");
            form.setValue("premisesAddress.section", business.section || "");
            form.setValue("premisesAddress.lot", business.lot || "");
            form.setValue("premisesAddress.suburb", business.suburb || "");
            form.setValue("premisesAddress.block", business.block || "");
            form.setValue("premisesAddress.village", business.village || "");
            form.setValue("premisesAddress.detail", business.physicalAddress || "");
        }
    }, [business, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {licenseTypeName && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Type</label>
                        <Input value={licenseTypeName} disabled className="bg-muted" />
                    </div>
                )}
                <FormField
                    control={form.control}
                    name="applicantName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Applicant Name</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="licenseType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>License Type Applying For</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select license type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="publicans">Publicans License</SelectItem>
                                    <SelectItem value="tavern">Tavern License</SelectItem>
                                    <SelectItem value="limited_hotel">Limited Hotel License</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <AddressFields control={form.control} namePrefix="premisesAddress" business={business} />
                <FormField
                    control={form.control}
                    name="premisesName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Known As</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="intentionToApply"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Intention Notice Details (optional)</FormLabel>
                            <FormControl><Textarea {...field} placeholder="Details of hearing intention..." /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </Button>
            </form>
        </Form>
    );
}

export function TradeLicenseForm({ onSubmit, isSubmitting, defaultValues, licenseTypeName, business }: FormProps<z.infer<typeof tradeLicenseSchema>>) {
    const form = useForm<z.infer<typeof tradeLicenseSchema>>({
        resolver: zodResolver(tradeLicenseSchema),
        defaultValues: defaultValues || {
            applicationType: "new",
            applicantName: "",
            tradingName: "",
            premisesAddress: { section: "", lot: "", suburb: "", block: "", village: "", detail: "" },
            businessActivity: "",
            managerName: "",
            attachments: {
                certificateOfIncorporation: undefined,
                companyExtract: undefined,
                businessNameRegistration: undefined,
                landTitle: undefined,
                landTaxReceipt: undefined,
                physicalPlanningApproval: undefined,
                buildingAuthorityApproval: undefined,
                foreignEnterpriseCertificate: undefined,
                previousLicense: undefined,
            }
        }
    });

    useEffect(() => {
        if (business) {
            form.setValue("applicantName", business.legalName || "");
            form.setValue("tradingName", business.tradingName || "");
            form.setValue("premisesAddress.section", business.section || "");
            form.setValue("premisesAddress.lot", business.lot || "");
            form.setValue("premisesAddress.suburb", business.suburb || "");
            form.setValue("premisesAddress.block", business.block || "");
            form.setValue("premisesAddress.village", business.village || "");
            form.setValue("premisesAddress.detail", business.physicalAddress || "");
        }
    }, [business, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {licenseTypeName && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Type</label>
                        <Input value={licenseTypeName} disabled className="bg-muted" />
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="applicationType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Application Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="new">New Application</SelectItem>
                                    <SelectItem value="transfer">Transfer of License</SelectItem>
                                    <SelectItem value="additional_activity">Additional Activity</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="applicantName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name of Applicant (Individual or Company)</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="tradingName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Trading Name</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <AddressFields control={form.control} namePrefix="premisesAddress" business={business} />

                <FormField
                    control={form.control}
                    name="businessActivity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description of Business Activity</FormLabel>
                            <FormControl><Textarea {...field} placeholder="Describe the goods or services..." /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="managerName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name of Manager (if applicable)</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Required Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="attachments.certificateOfIncorporation"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Certificate of Incorporation</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...fieldProps}
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                            onChange={(event) => {
                                                onChange(event.target.files && event.target.files[0]);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="attachments.companyExtract"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Company Extract</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...fieldProps}
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                            onChange={(event) => {
                                                onChange(event.target.files && event.target.files[0]);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="attachments.businessNameRegistration"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Certificate of Registration of Business Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...fieldProps}
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                            onChange={(event) => {
                                                onChange(event.target.files && event.target.files[0]);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="attachments.landTitle"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Land Title/Lease Agreement</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...fieldProps}
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                            onChange={(event) => {
                                                onChange(event.target.files && event.target.files[0]);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="attachments.landTaxReceipt"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Land Tax & Garbage Rates Receipt</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...fieldProps}
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                            onChange={(event) => {
                                                onChange(event.target.files && event.target.files[0]);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="attachments.physicalPlanningApproval"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Physical Planning Approval</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...fieldProps}
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                            onChange={(event) => {
                                                onChange(event.target.files && event.target.files[0]);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="attachments.buildingAuthorityApproval"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Building Authority Approval</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...fieldProps}
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                            onChange={(event) => {
                                                onChange(event.target.files && event.target.files[0]);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="attachments.foreignEnterpriseCertificate"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Certificate Permitting Foreigners to Operate Business</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...fieldProps}
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                            onChange={(event) => {
                                                onChange(event.target.files && event.target.files[0]);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="attachments.previousLicense"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Copy of License for Previous Operator</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...fieldProps}
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                            onChange={(event) => {
                                                onChange(event.target.files && event.target.files[0]);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </Button>
            </form>
        </Form>
    );
}

export function StorekeeperLicenseForm({ onSubmit, isSubmitting, defaultValues, licenseTypeName, business }: FormProps<z.infer<typeof storekeeperSchema>>) {
    const form = useForm<z.infer<typeof storekeeperSchema>>({
        resolver: zodResolver(storekeeperSchema),
        defaultValues: defaultValues || {
            applicantName: "",
            tradingName: "",
            storageAddress: { section: "", lot: "", suburb: "", block: "", village: "", detail: "" },
            goodsDescription: "",
            periodAppliedFor: "One Year"
        }
    });

    useEffect(() => {
        if (business) {
            form.setValue("applicantName", business.legalName || "");
            form.setValue("tradingName", business.tradingName || "");
            form.setValue("storageAddress.section", business.section || "");
            form.setValue("storageAddress.lot", business.lot || "");
            form.setValue("storageAddress.suburb", business.suburb || "");
            form.setValue("storageAddress.block", business.block || "");
            form.setValue("storageAddress.village", business.village || "");
            form.setValue("storageAddress.detail", business.physicalAddress || "");
        }
    }, [business, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {licenseTypeName && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Type</label>
                        <Input value={licenseTypeName} disabled className="bg-muted" />
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="applicantName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Applicant Name</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="tradingName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Trading Name</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <AddressFields control={form.control} namePrefix="storageAddress" business={business} />

                <FormField
                    control={form.control}
                    name="goodsDescription"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description of Goods to be Stored</FormLabel>
                            <FormControl><Textarea {...field} placeholder="List main categories of goods..." /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="periodAppliedFor"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Period Applied For</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="One Year">One Year</SelectItem>
                                    <SelectItem value="Three Years">Three Years</SelectItem>
                                    <SelectItem value="Five Years">Five Years</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </Button>
            </form>
        </Form>
    );
}

export function SecondHandDealerForm({ onSubmit, isSubmitting, defaultValues, licenseTypeName, business }: FormProps<z.infer<typeof secondHandDealerSchema>>) {
    const form = useForm<z.infer<typeof secondHandDealerSchema>>({
        resolver: zodResolver(secondHandDealerSchema),
        defaultValues: defaultValues || {
            applicantName: "",
            tradingName: "",
            premisesAddress: { section: "", lot: "", suburb: "", block: "", village: "", detail: "" },
            goodsClasses: "",
            fumigatorName: "",
            fumigationMethod: ""
        }
    });

    useEffect(() => {
        if (business) {
            form.setValue("applicantName", business.legalName || "");
            form.setValue("tradingName", business.tradingName || "");
            form.setValue("premisesAddress.section", business.section || "");
            form.setValue("premisesAddress.lot", business.lot || "");
            form.setValue("premisesAddress.suburb", business.suburb || "");
            form.setValue("premisesAddress.block", business.block || "");
            form.setValue("premisesAddress.village", business.village || "");
            form.setValue("premisesAddress.detail", business.physicalAddress || "");
        }
    }, [business, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {licenseTypeName && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Type</label>
                        <Input value={licenseTypeName} disabled className="bg-muted" />
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="applicantName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Applicant Name</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="tradingName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Trading Name</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <AddressFields control={form.control} namePrefix="premisesAddress" business={business} />

                <FormField
                    control={form.control}
                    name="goodsClasses"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Class of Goods (e.g. scrap metal, furniture, vehicles)</FormLabel>
                            <FormControl><Textarea {...field} placeholder="List types of goods..." /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="border p-4 rounded-md space-y-4">
                    <FormLabel>Fumigation Details (if applicable)</FormLabel>
                    <FormField
                        control={form.control}
                        name="fumigatorName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Licensed Fumigator Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="fumigationMethod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Method Used</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </Button>
            </form>
        </Form>
    );
}

export function RestaurantLicenseForm({ onSubmit, isSubmitting, defaultValues, licenseTypeName, business }: FormProps<z.infer<typeof restaurantLicenseSchema>>) {
    const form = useForm<z.infer<typeof restaurantLicenseSchema>>({
        resolver: zodResolver(restaurantLicenseSchema),
        defaultValues: defaultValues || {
            applicantName: "",
            tradingName: "",
            premisesAddress: { section: "", lot: "", suburb: "", block: "", village: "", detail: "" },
            seatingCapacity: 0,
            sanitaryFacilities: "",
            haccpPlanRef: "",
            menuDescription: ""
        }
    });

    useEffect(() => {
        if (business) {
            form.setValue("applicantName", business.legalName || "");
            form.setValue("tradingName", business.tradingName || "");
            form.setValue("premisesAddress.section", business.section || "");
            form.setValue("premisesAddress.lot", business.lot || "");
            form.setValue("premisesAddress.suburb", business.suburb || "");
            form.setValue("premisesAddress.block", business.block || "");
            form.setValue("premisesAddress.village", business.village || "");
            form.setValue("premisesAddress.detail", business.physicalAddress || "");
        }
    }, [business, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {licenseTypeName && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Type</label>
                        <Input value={licenseTypeName} disabled className="bg-muted" />
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="applicantName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Applicant Name</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="tradingName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Trading Name</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <AddressFields control={form.control} namePrefix="premisesAddress" business={business} />

                <FormField
                    control={form.control}
                    name="seatingCapacity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Maximum Seating Capacity</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="sanitaryFacilities"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description of Sanitary Facilities (Toilets, etc.)</FormLabel>
                            <FormControl><Textarea {...field} placeholder="Describe types and numbers of toilets..." /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="border p-4 rounded-md space-y-4">
                    <FormLabel>Health & Safety Details</FormLabel>
                    <FormField
                        control={form.control}
                        name="haccpPlanRef"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>HACCP Plan Reference / Details</FormLabel>
                                <FormControl><Input {...field} placeholder="Ref No. or 'Attached'" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="menuDescription"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Menu Description / Reference</FormLabel>
                                <FormControl><Input {...field} placeholder="Brief description or 'Attached'" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </Button>
            </form>
        </Form>
    );
}

export function BottleShopLicenseForm({ onSubmit, isSubmitting, defaultValues, licenseTypeName, business }: FormProps<z.infer<typeof bottleShopSchema>>) {
    const form = useForm<z.infer<typeof bottleShopSchema>>({
        resolver: zodResolver(bottleShopSchema),
        defaultValues: defaultValues || {
            applicantName: "",
            tradingName: "",
            premisesAddress: { section: "", lot: "", suburb: "", block: "", village: "", detail: "" },
            liquorLicenseNo: "",
            liquorTypes: "",
            securityMeasures: "",
            managerName: ""
        }
    });

    useEffect(() => {
        if (business) {
            form.setValue("applicantName", business.legalName || "");
            form.setValue("tradingName", business.tradingName || "");
            form.setValue("premisesAddress.section", business.section || "");
            form.setValue("premisesAddress.lot", business.lot || "");
            form.setValue("premisesAddress.suburb", business.suburb || "");
            form.setValue("premisesAddress.block", business.block || "");
            form.setValue("premisesAddress.village", business.village || "");
            form.setValue("premisesAddress.detail", business.physicalAddress || "");
        }
    }, [business, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {licenseTypeName && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Type</label>
                        <Input value={licenseTypeName} disabled className="bg-muted" />
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="applicantName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Applicant Name</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="tradingName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Trading Name</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <AddressFields control={form.control} namePrefix="premisesAddress" business={business} />

                <FormField
                    control={form.control}
                    name="liquorLicenseNo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Liquor License Number (if any)</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="liquorTypes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Types of Liquor Sold</FormLabel>
                            <FormControl><Textarea {...field} placeholder="e.g. Beer, Wine, Spirits..." /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="securityMeasures"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Security Measures</FormLabel>
                            <FormControl><Textarea {...field} placeholder="Describe cameras, alarms, security personnel..." /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="managerName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name of Manager</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </Button>
            </form>
        </Form>
    );
}

export function ElectronicShopLicenseForm({ onSubmit, isSubmitting, defaultValues, licenseTypeName, business }: FormProps<z.infer<typeof electronicShopSchema>>) {
    const form = useForm<z.infer<typeof electronicShopSchema>>({
        resolver: zodResolver(electronicShopSchema),
        defaultValues: defaultValues || {
            applicantName: "",
            tradingName: "",
            premisesAddress: { section: "", lot: "", suburb: "", block: "", village: "", detail: "" },
            businessActivity: "",
            radioLicenseNo: "",
            managerName: ""
        }
    });

    useEffect(() => {
        if (business) {
            form.setValue("applicantName", business.legalName || "");
            form.setValue("tradingName", business.tradingName || "");
            form.setValue("premisesAddress.section", business.section || "");
            form.setValue("premisesAddress.lot", business.lot || "");
            form.setValue("premisesAddress.suburb", business.suburb || "");
            form.setValue("premisesAddress.block", business.block || "");
            form.setValue("premisesAddress.village", business.village || "");
            form.setValue("premisesAddress.detail", business.physicalAddress || "");
        }
    }, [business, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {licenseTypeName && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Type</label>
                        <Input value={licenseTypeName} disabled className="bg-muted" />
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="applicantName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Applicant Name</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="tradingName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Trading Name</FormLabel>
                            <FormControl><Input {...field} disabled={!!business} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <AddressFields control={form.control} namePrefix="premisesAddress" business={business} />

                <FormField
                    control={form.control}
                    name="businessActivity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Business Activity Description</FormLabel>
                            <FormControl><Textarea {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="radioLicenseNo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Radio Apparatus License No. (ZICTA)</FormLabel>
                            <FormControl><Input {...field} placeholder="If applicable" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="managerName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Manager Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </Button>
            </form>
        </Form>
    );
}
