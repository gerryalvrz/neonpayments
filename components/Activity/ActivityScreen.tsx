'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { BackButton } from '@/components/Layout/BackButton';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Tabs } from '@/components/UI/Tabs';
import { Button } from '@/components/UI/Button';
import { Icon, BellIcon, CheckCircleIcon, ExclamationCircleIcon, HistoryIcon, UserIcon } from '@/components/Icons';
import type { Notification } from '@/types';

export function ActivityScreen() {
  const router = useRouter();
  const { notifications, markNotificationRead, language } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | Notification['type']>('all');

  const labels = {
    en: {
      title: 'Activity & Notifications',
      all: 'All',
      transaction: 'Transactions',
      verification: 'Verification',
      system: 'System',
      security: 'Security',
      noNotifications: 'No notifications',
      noNotificationsDesc: 'You\'re all caught up!',
      markAllRead: 'Mark all as read',
      view: 'View',
      ago: 'ago',
      minutes: 'minutes',
      hours: 'hours',
      days: 'days',
    },
    es: {
      title: 'Actividad y Notificaciones',
      all: 'Todas',
      transaction: 'Transacciones',
      verification: 'Verificación',
      system: 'Sistema',
      security: 'Seguridad',
      noNotifications: 'Sin notificaciones',
      noNotificationsDesc: '¡Estás al día!',
      markAllRead: 'Marcar todas como leídas',
      view: 'Ver',
      ago: 'hace',
      minutes: 'minutos',
      hours: 'horas',
      days: 'días',
    },
  };

  const t = labels[language];

  const tabs = [
    { id: 'all', label: t.all },
    { id: 'transaction', label: t.transaction },
    { id: 'verification', label: t.verification },
    { id: 'system', label: t.system },
    { id: 'security', label: t.security },
  ];

  const filteredNotifications = notifications.filter(notif =>
    activeTab === 'all' || notif.type === activeTab
  );

  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    filteredNotifications.forEach(notif => {
      if (!notif.read) {
        markNotificationRead(notif.id);
      }
    });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'transaction':
        return <HistoryIcon />;
      case 'verification':
        return <CheckCircleIcon />;
      case 'security':
        return <ExclamationCircleIcon />;
      default:
        return <BellIcon />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'transaction':
        return 'info';
      case 'verification':
        return 'success';
      case 'security':
        return 'error';
      default:
        return 'gray';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) {
      return `${days} ${t.days} ${t.ago}`;
    } else if (hours > 0) {
      return `${hours} ${t.hours} ${t.ago}`;
    } else if (minutes > 0) {
      return `${minutes} ${t.minutes} ${t.ago}`;
    } else {
      return 'Just now';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <Container>
      <div className="py-8">
        <BackButton />
        
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
            >
              {t.markAllRead}
            </Button>
          )}
        </div>

        <div className="mb-6">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab as typeof activeTab)}
          />
        </div>

        {filteredNotifications.length === 0 ? (
          <Card padding="lg" className="text-center py-12">
            <Icon size="xl" color="gray" className="mb-4 mx-auto">
              <BellIcon />
            </Icon>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.noNotifications}</h3>
            <p className="text-gray-600 dark:text-gray-300">{t.noNotificationsDesc}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                variant={notification.read ? 'default' : 'interactive'}
                padding="md"
                onClick={() => handleNotificationClick(notification)}
                className={`cursor-pointer transition-all ${
                  !notification.read ? 'border-acid-lemon shadow-acid' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    notification.type === 'transaction' ? 'bg-blue-100' :
                    notification.type === 'verification' ? 'bg-green-100' :
                    notification.type === 'security' ? 'bg-red-100' :
                    'bg-gray-100'
                  }`}>
                    <Icon
                      color={getNotificationColor(notification.type)}
                      size="md"
                    >
                      {getNotificationIcon(notification.type)}
                    </Icon>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-semibold text-gray-900 dark:text-white ${
                        !notification.read ? 'font-bold' : ''
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-acid-lemon rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                      <Badge variant="default" size="sm" className="capitalize">
                        {notification.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}

