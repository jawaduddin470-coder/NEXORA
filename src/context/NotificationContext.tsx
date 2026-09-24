import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { NotificationItem } from '../types';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user || !db) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));

    // Real-time Firestore listener for user notifications
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          notificationId: d.id,
          ...d.data(),
        })) as NotificationItem[];

        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(items);
        setLoading(false);
      },
      (error) => {
        console.error('Realtime notification listener error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    const firestoreDb = db;
    if (!firestoreDb || !user) return;
    try {
      const notifRef = doc(firestoreDb, 'notifications', id);
      await updateDoc(notifRef, { read: true });
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    const firestoreDb = db;
    if (!firestoreDb || !user) return;
    try {
      const unreadList = notifications.filter((n) => !n.read);
      if (unreadList.length === 0) return;

      const batch = writeBatch(firestoreDb);
      unreadList.forEach((n) => {
        const notifRef = doc(firestoreDb, 'notifications', n.notificationId);
        batch.update(notifRef, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
