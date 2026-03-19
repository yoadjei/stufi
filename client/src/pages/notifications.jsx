import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, AlertTriangle, Info, DollarSign, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { formatDateTime, apiRequest } from "@/lib/api";

const getNotificationIcon = (kind) => {
  switch (kind) {
    case "tight":
      return { icon: AlertTriangle, bgColor: "bg-amber-100", iconColor: "text-amber-600" };
    case "critical":
      return { icon: AlertTriangle, bgColor: "bg-red-100", iconColor: "text-red-600" };
    case "cap_exceeded":
      return { icon: DollarSign, bgColor: "bg-orange-100", iconColor: "text-orange-600" };
    default:
      return { icon: Info, bgColor: "bg-blue-100", iconColor: "text-blue-600" };
  }
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiRequest("PUT", `/api/notifications/${id}/read`);
      if (!response.ok) {
        throw new Error("Failed to mark as read");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadNotifications = notifications?.filter((n) => !n.readAt) || [];
  const readNotifications = notifications?.filter((n) => n.readAt) || [];

  const NotificationItem = ({ notification }) => {
    const { icon: Icon, bgColor, iconColor } = getNotificationIcon(notification.kind);
    const isUnread = !notification.readAt;

    return (
      <div
        className={`flex items-start gap-4 p-4 ${isUnread ? "bg-primary/5" : ""}`}
        data-testid={`notification-${notification.id}`}
      >
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`font-medium text-sm ${isUnread ? "" : "text-muted-foreground"}`}>
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
            </div>
            {isUnread && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => markReadMutation.mutate(notification.id)}
                data-testid={`button-mark-read-${notification.id}`}
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDateTime(notification.createdAt)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <SubPageLayout title="Notifications" backPath="/more">
      <div className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-6">
            {unreadNotifications.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  New ({unreadNotifications.length})
                </h3>
                <Card>
                  <CardContent className="p-0 divide-y divide-border">
                    {unreadNotifications.map((notification) => (
                      <NotificationItem key={notification.id} notification={notification} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {readNotifications.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Earlier</h3>
                <Card>
                  <CardContent className="p-0 divide-y divide-border">
                    {readNotifications.map((notification) => (
                      <NotificationItem key={notification.id} notification={notification} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No Notifications</h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up! Notifications about your spending will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </SubPageLayout>
  );
}
