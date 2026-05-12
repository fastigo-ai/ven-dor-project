import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  Notification
} from '@/services/notificationApi';

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [notifRes, countRes] = await Promise.all([
      fetchNotifications(),
      fetchUnreadCount()
    ]);

    if (notifRes.data) setNotifications(notifRes.data);
    if (countRes.data) setUnreadCount(countRes.data.unread_count);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    const res = await markNotificationRead(id);
    if (res.success) {
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && loadData()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 transition-colors">
          <Bell className="h-5 w-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm">
        <DropdownMenuLabel className="flex items-center justify-between p-4">
          <span className="font-bold text-lg">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
              {unreadCount} New
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {loading && notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">
              Loading alerts...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">All caught up!</p>
              <p className="text-xs mt-1 ">No new notifications</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-border/50 hover:bg-primary/5 transition-colors cursor-pointer relative group ${!notification.is_read ? 'bg-primary/5' : ''
                    }`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification._id)}
                >
                  {!notification.is_read && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                  )}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold capitalize ${!notification.is_read ? 'text-primary' : 'text-foreground'}`}>
                        {notification.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    {notification.type && (
                      <Badge variant="outline" className="w-fit text-[9px] h-4 mt-1 bg-muted/30">
                        {notification.type}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button variant="ghost" className="w-full text-xs h-8 text-primary hover:text-primary hover:bg-primary/10">
            View All Activity
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
