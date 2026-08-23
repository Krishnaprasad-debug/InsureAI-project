import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Trash2, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type Notification } from '../lib/supabase';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { timeAgo, cn } from '../lib/utils';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'text-accent-500 bg-accent-50 dark:bg-accent-900/20',
  error: 'text-danger-500 bg-danger-50 dark:bg-danger-900/20',
  info: 'text-primary-500 bg-primary-50 dark:bg-primary-900/20',
  warning: 'text-warning-500 bg-warning-50 dark:bg-warning-500/10',
};

export function NotificationsPage() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setNotifications(data as Notification[] || []);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = async () => {
    if (!profile?.id) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false);
    fetchNotifications();
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    fetchNotifications();
  };

  const deleteNotif = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    fetchNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm font-normal text-gray-500">({unreadCount} unread)</span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Stay updated on your claims and predictions.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif, i) => {
            const Icon = icons[notif.type as keyof typeof icons] || Info;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={cn('p-4', !notif.read && 'border-primary-200 dark:border-primary-800')}>
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colors[notif.type as keyof typeof colors] || colors.info)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {!notif.read && (
                            <button onClick={() => markRead(notif.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-600">
                              <CheckCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => deleteNotif(notif.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-danger-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-16">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications yet</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
