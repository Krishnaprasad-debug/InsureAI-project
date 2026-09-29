import { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, type Notification } from '../lib/supabase';

export function NotificationsDropdown({ isCompany = false }: { isCompany?: boolean }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling for simplicity
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10);
      
      if (isCompany) {
        query = query.eq('target_role', 'company');
      } else {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query;
      if (data && !error) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    let query = supabase.from('notifications').update({ read: true }).eq('read', false);
    if (isCompany) {
      query = query.eq('target_role', 'company');
    } else {
      query = query.eq('user_id', user.id);
    }
    await query;
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    setOpen(false);
    if (n.claim_id) {
      navigate(isCompany ? `/company/claims/${n.claim_id}` : `/claims/${n.claim_id}`);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-slate-900/10 border border-gray-200 dark:border-gray-800 overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="font-semibold text-gray-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No notifications yet</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${!n.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          n.type === 'success' ? 'bg-primary-100 text-primary-600' :
                          n.type === 'danger' || n.type === 'error' ? 'bg-danger-100 text-danger-600' :
                          n.type === 'warning' ? 'bg-warning-100 text-warning-600' :
                          'bg-secondary-100 text-secondary-600'
                        }`}>
                          {n.type === 'success' ? <ShieldCheck className="w-4 h-4" /> :
                           n.type === 'danger' || n.type === 'error' ? <AlertTriangle className="w-4 h-4" /> :
                           <Info className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{n.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-center">
              <Link to={isCompany ? "/company/notifications" : "/notifications"} onClick={() => setOpen(false)} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium">
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
