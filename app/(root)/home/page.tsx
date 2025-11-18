'use client';

import React, { useEffect, useState } from 'react';
import {
  Package,
  Truck,
  Users,
  TrendingUp,
  Calendar,
  Phone,
  MapPin,
} from 'lucide-react';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/skeleton.css';

// Make the main component a client component
export default function ColdStoreDashboard() {
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [recentEntryReceipts, setRecentEntryReceipts] = useState<any[]>([]);
  const [recentClearanceReceipts, setRecentClearanceReceipts] = useState<any[]>(
    []
  );
  const [stats, setStats] = useState<any[]>([
    {
      label: 'Total Customers',
      value: '-',
      icon: Users,
      color: 'bg-primary/10 text-primary',
      iconColor: 'bg-primary',
      change: '',
    },
    {
      label: 'Active Entries',
      value: '-',
      icon: Package,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      iconColor: 'bg-blue-500',
      change: '',
    },
    {
      label: 'Clearances Today',
      value: '-',
      icon: Truck,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      iconColor: 'bg-purple-500',
      change: '',
    },
    {
      label: 'Monthly Revenue',
      value: '-',
      icon: TrendingUp,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      iconColor: 'bg-orange-500',
      change: '',
    },
  ]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [customersRes, entryRes, clearanceRes, statsRes] =
          await Promise.all([
            axios.get('/api/customer/recent?limit=5'),
            axios.get('/api/entry/recent?limit=5'),
            axios.get('/api/clearance/recent?limit=5'),
            axios.get('/api/dashboard/stats'),
          ]);

        setRecentCustomers(customersRes?.data?.data || []);
        setRecentEntryReceipts(entryRes?.data?.data || []);
        setRecentClearanceReceipts(clearanceRes?.data?.data || []);

        // Map stats API to the UI structure
        const s = statsRes?.data?.data || {};
        setStats([
          {
            label: 'Total Customers',
            value: s.totalCustomers?.toString() || '-',
            icon: Users,
            color: 'bg-primary/10 text-primary',
            iconColor: 'bg-primary',
            change: '',
          },
          {
            label: 'Active Entries',
            value: s.activeEntries?.toString() || '-',
            icon: Package,
            color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            iconColor: 'bg-blue-500',
            change: '',
          },
          {
            label: 'Clearances Today',
            value: s.clearancesToday?.toString() || '-',
            icon: Truck,
            color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
            iconColor: 'bg-purple-500',
            change: '',
          },
          {
            label: 'Monthly Revenue',
            value: s.monthlyRevenue
              ? `₨${Number(s.monthlyRevenue).toLocaleString()}`
              : '-',
            icon: TrendingUp,
            color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
            iconColor: 'bg-orange-500',
            change: '',
          },
        ]);
      } catch (err: any) {
        console.error('Error loading dashboard data', err);
        setError(err?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className=" w-full h-full rounded-2xl bg-background p-4 md:p-8">
      <div className=" mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Cold Store Management
          </h1>
          <p className="text-muted-foreground">
            Dashboard Overview -{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        {loading && (
          <>
            {/* Stats skeletons */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl shadow-sm transition-all duration-300 p-6 border border-border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg shadow-sm">
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>

                  <Skeleton className="h-4 w-28 mb-2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>

            {/* Recent Activity skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, cardIdx) => (
                <div
                  key={cardIdx}
                  className="bg-card rounded-xl shadow-sm border border-border overflow-hidden"
                >
                  <div className="bg-muted p-6">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((__, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-lg bg-secondary/50 transition-colors cursor-pointer border border-border"
                        >
                          <Skeleton className="h-4 w-48 mb-2" />
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {error && (
          <div className="mb-4 text-sm text-destructive">Error: {error}</div>
        )}

        {/* Stats Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat: any, index: number) => (
              <div
                key={index}
                className="bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.iconColor} p-3 rounded-lg shadow-sm`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-primary text-sm font-semibold bg-primary/10 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-muted-foreground text-sm font-medium mb-1">
                  {stat.label}
                </h3>
                <p className="text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Recent Activity Grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Customers */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="bg-primary p-6">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary-foreground" />
                  <h2 className="text-xl font-bold text-primary-foreground">
                    Recent Customers
                  </h2>
                </div>
              </div>
              <div className="p-6">
                {recentCustomers.length > 0 ? (
                  <div className="space-y-4">
                    {recentCustomers.map((customer: any) => (
                      <div
                        key={customer.id}
                        className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer border border-border"
                      >
                        <h3 className="font-semibold text-foreground mb-2">
                          {customer.name}
                        </h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{customer.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{customer.village}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No recent customers
                  </p>
                )}
              </div>
            </div>

            {/* Recent Entry Receipts */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="bg-blue-500 p-6">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">
                    Entry Receipts
                  </h2>
                </div>
              </div>
              <div className="p-6">
                {recentEntryReceipts.length > 0 ? (
                  <div className="space-y-4">
                    {recentEntryReceipts.map((receipt: any) => (
                      <div
                        key={receipt.id}
                        className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer border border-border"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-foreground">
                            {receipt.receiptNo}
                          </span>
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">
                            Active
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{receipt.customer?.name || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            <span>{receipt.carNo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {receipt.entryDate
                                ? new Date(
                                    receipt.entryDate
                                  ).toLocaleDateString()
                                : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No recent entry receipts
                  </p>
                )}
              </div>
            </div>

            {/* Recent Clearance Receipts */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="bg-purple-500 p-6">
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Clearances</h2>
                </div>
              </div>
              <div className="p-6">
                {recentClearanceReceipts.length > 0 ? (
                  <div className="space-y-4">
                    {recentClearanceReceipts.map((receipt: any) => (
                      <div
                        key={receipt.id}
                        className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer border border-border"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-foreground">
                            {receipt.clearanceNo}
                          </span>
                          <span className="text-xs bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full font-medium">
                            Cleared
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{receipt.customer?.name || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            <span>{receipt.carNo || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {receipt.clearanceDate
                                ? new Date(
                                    receipt.clearanceDate
                                  ).toLocaleDateString()
                                : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No recent clearance receipts
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// (removed duplicate export default function)
