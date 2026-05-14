import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Clock } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Load on mount and set interval for polling
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      loadNotifications();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all/read');
      loadNotifications();
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      loadNotifications();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  // Get icon based on type
  const getNotificationIcon = (type) => {
    const icons = {
      'attendance_marked': <CheckCircle size={16} color="#10b981" />,
      'attendance_enabled': <Clock size={16} color="#3b82f6" />,
      'class_scheduled': <Info size={16} color="#8b5cf6" />,
      'course_added': <Info size={16} color="#f59e0b" />,
      'assignment_created': <AlertCircle size={16} color="#ef4444" />,
      'user_registered': <CheckCircle size={16} color="#10b981" />,
      'user_approved': <CheckCircle size={16} color="#10b981" />,
      'user_rejected': <AlertCircle size={16} color="#ef4444" />,
      'message': <Info size={16} color="#3b82f6" />,
      'login_success': <CheckCircle size={16} color="#10b981" />,
      'login_failed': <AlertCircle size={16} color="#ef4444" />
    };
    return icons[type] || <Bell size={16} />;
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell Icon */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Notifications"
      >
        <Bell size={20} color="var(--text-primary)" />
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: 'var(--red)',
              color: '#fff',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '0',
            width: '380px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '500px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700' }}>Notifications</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {unreadCount} new message{unreadCount !== 1 ? 's' : ''}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  textDecoration: 'underline'
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              maxHeight: '420px'
            }}
          >
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="spinner spinner-sm" style={{ margin: '0 auto 12px' }} />
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  onClick={() => !notif.isRead && markAsRead(notif._id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: notif.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    gap: '12px',
                    ':hover': {
                      background: 'var(--bg-elevated)'
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)';
                  }}
                >
                  {/* Icon */}
                  <div style={{ flexShrink: 0, marginTop: '4px' }}>
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: notif.isRead ? '500' : '700',
                        fontSize: '13px',
                        marginBottom: '4px',
                        color: notif.isRead ? 'var(--text-secondary)' : 'var(--text-primary)'
                      }}
                    >
                      {notif.title}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        lineHeight: '1.4',
                        marginBottom: '6px'
                      }}
                    >
                      {notif.message}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        opacity: 0.7
                      }}
                    >
                      {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                      {new Date(notif.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif._id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: 'var(--text-muted)',
                      flexShrink: 0
                    }}
                    title="Delete"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}
    </div>
  );
}
