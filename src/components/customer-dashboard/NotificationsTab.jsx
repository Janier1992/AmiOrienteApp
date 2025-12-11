import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';
import { Bell, Check, Info, Package, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotificationsTab = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'user_notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data || []);
  };

  const markAsRead = async (id) => {
    await supabase.from('user_notifications').update({ read: true }).eq('id', id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await supabase.from('user_notifications').update({ read: true }).eq('user_id', userId);
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type) => {
    switch(type) {
        case 'order': return <Package className="h-5 w-5 text-blue-500" />;
        case 'promo': return <Tag className="h-5 w-5 text-purple-500" />;
        default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Notificaciones</CardTitle>
        {notifications.some(n => !n.read) && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>Marcar todo como leído</Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {notifications.length === 0 ? (
             <div className="text-center py-10 text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No tienes notificaciones nuevas.</p>
             </div>
          ) : (
             notifications.map((notif) => (
                <div 
                    key={notif.id} 
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${notif.read ? 'bg-background' : 'bg-blue-50/50 border-blue-100'}`}
                >
                    <div className="mt-1">{getIcon(notif.type)}</div>
                    <div className="flex-grow">
                        <h4 className={`text-sm ${notif.read ? 'font-medium' : 'font-bold'}`}>{notif.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                    </div>
                    {!notif.read && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => markAsRead(notif.id)}>
                            <Check className="h-4 w-4" />
                        </Button>
                    )}
                </div>
             ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsTab;