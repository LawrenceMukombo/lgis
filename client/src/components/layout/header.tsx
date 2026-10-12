import { Bell, Search, Menu, User, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOCK_USERS } from "@/lib/mock-data";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/organization-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Header() {
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  // const user = MOCK_USERS[0]; // Removed hardcoded mock user
  const [location, setLocation] = useLocation();
  const { currentOrganization, setCurrentOrganization, organizations } = useOrganization();

  const handleLogout = () => {
    setLocation("/");
  };

  const handleCouncilSwitch = (org: any) => {
    setCurrentOrganization(org);
    toast({
      title: "Organization Switched",
      description: `Active context changed to ${org.name}`,
    });
  };

  const { data: notifications } = useQuery({
    queryKey: ["/api/v1/notifications", user?.userId],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest("GET", `/api/v1/notifications?userId=${user.userId}`);
      return res.json();
    },
    enabled: !!user
  });

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-8 h-header bg-header text-header-foreground border-b border-outline-dimmer shadow-sm"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto p-0 hover:bg-transparent font-normal flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-left text-foreground-default">
                  {currentOrganization?.name || "Lusaka City Council"}
                </span>
                <ChevronDown className="h-4 w-4 text-foreground-dimmer" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[300px] bg-background-default border-outline-dimmer">
              <DropdownMenuLabel className="text-foreground-default">Switch Organization</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-outline-dimmer" />
              {organizations
                .filter((org, index, self) =>
                  index === self.findIndex((t) => t.name === org.name)
                )
                .map((org) => (
                  <DropdownMenuItem key={org.councilId} onClick={() => handleCouncilSwitch(org)} className="cursor-pointer">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground-default">{org.name}</span>
                      <span className="text-xs text-foreground-dimmer">{org.level}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-xs flex items-center mt-0.5 text-foreground-dimmer font-medium">
            <MapPin className="h-3 w-3 mr-1 text-accent-negative-default" />
            {currentOrganization?.countryCode === 'ZM' ? '🇿🇲 Zambia' : currentOrganization?.countryCode === 'PG' ? '🇵🇬 Papua New Guinea' : (currentOrganization?.countryCode ? `Tenant: ${currentOrganization.countryCode}` : 'Local Government')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden w-64 sm:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground-dimmest" />
          <Input
            type="search"
            placeholder={`Search ${currentOrganization?.name || "council"} records...`}
            className="w-full pl-10 md:w-[300px] bg-background-higher border-outline-dimmer text-sm rounded-md"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative transition-colors text-foreground-default">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-accent-negative-default"
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 bg-background-default border-outline-dimmer">
            <h4 className="font-semibold mb-2 text-foreground-default">Notifications</h4>
            <ScrollArea className="h-[300px]">
              {notifications?.length === 0 ? (
                <p className="text-sm p-4 text-center text-foreground-dimmer">No notifications</p>
              ) : (
                <div className="space-y-1">
                  {notifications?.map((n: any) => (
                    <div
                      key={n.notificationId}
                      className={cn(
                        "p-3 rounded-lg text-sm",
                        !n.read ? "font-medium bg-background-higher" : "transparent"
                      )}
                    >
                      <p className="font-medium text-foreground-default">{n.title}</p>
                      <p className="text-foreground-dimmer">{n.message}</p>
                      <p className="text-xs mt-1 text-foreground-dimmest">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full transition-all bg-foreground-default text-background-default"
            >
              <span className="font-bold text-xs">
                {user?.fullName ?
                  user.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                  : "U"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-background-default border-outline-dimmer">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-foreground-default">{user?.fullName || "User"}</p>
                <p className="text-xs leading-none text-foreground-dimmer">{user?.email || "No email"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-outline-dimmer" />
            {user && ["admin", "manager", "officer"].includes(user.role) && (
              <>
                <DropdownMenuItem className="text-foreground-default">Officer Profile</DropdownMenuItem>
                <DropdownMenuItem className="text-foreground-default">Council Settings</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-outline-dimmer" />
              </>
            )}
            <DropdownMenuItem className="focus:bg-red-50 text-accent-negative-default" onClick={handleLogout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
