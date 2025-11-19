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
  MoreHorizontal,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button'; // Assuming you have a button component, or use standard button
import '@/styles/skeleton.css';
import { useRouter } from 'next/navigation';

export default function ColdStoreDashboard() {
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [recentEntryReceipts, setRecentEntryReceipts] = useState<any[]>([]);
  const [recentClearanceReceipts, setRecentClearanceReceipts] = useState<any[]>(
    []
  );
  const router = useRouter();

  const [stats, setStats] = useState<any[]>([
    {
      label: 'Total Customers',
      value: '-',
      icon: Users,
      trend: '+2.5%',
      trendUp: true,
    },
    {
      label: 'Active Entries',
      value: '-',
      icon: Package,
      trend: '+12',
      trendUp: true,
    },
    {
      label: 'Clearances Today',
      value: '-',
      icon: Truck,
      trend: 'On track',
      trendUp: true,
    },
    {
      label: 'Monthly Revenue',
      value: '-',
      icon: TrendingUp,
      trend: '+8.2%',
      trendUp: true,
    },
  ]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // Simulating API call structure
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

        const s = statsRes?.data?.data || {};
        setStats((prev) => [
          { ...prev[0], value: s.totalCustomers?.toString() || '-' },
          { ...prev[1], value: s.activeEntries?.toString() || '-' },
          { ...prev[2], value: s.clearancesToday?.toString() || '-' },
          {
            ...prev[3],
            value: s.monthlyRevenue
              ? `₨${Number(s.monthlyRevenue).toLocaleString()}`
              : '-',
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

  // Helper to render initials
  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <div className="w-full h-full  bg-background rounded-2xl p-4 md:p-6">
      <div className="mx-auto  space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Cold Store Overview &bull;{' '}
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {error && (
              <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                Error loading data: {error}
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-card p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow space-y-2"
                >
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium uppercase tracking-wider">
                      {stat.label}
                    </span>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </h3>
                    <span
                      className={`text-xs font-medium ${stat.trendUp ? 'text-green-600 bg-green-500/10' : 'text-red-600 bg-red-500/10'} px-1.5 py-0.5 rounded-full`}
                    >
                      {stat.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
              {/* Customers Column */}
              <div className="bg-card rounded-xl border shadow-sm flex flex-col h-full">
                <div className="p-4 border-b flex items-center justify-between bg-muted/10">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-sm">Recent Customers</h3>
                  </div>
                  <button
                    onClick={() => router.push('customers')}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y">
                  {recentCustomers.length > 0 ? (
                    recentCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 flex items-center gap-3 hover:bg-muted/40 transition-colors group cursor-pointer"
                      >
                        <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {getInitials(customer.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {customer.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3" /> {customer.village}
                            </span>
                          </div>
                        </div>
                        <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted border border-transparent hover:border-border">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState label="No customers" />
                  )}
                </div>
              </div>

              {/* Entries Column */}
              <div className="bg-card rounded-xl border shadow-sm flex flex-col h-full">
                <div className="p-4 border-b flex items-center justify-between bg-muted/10">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-600" />
                    <h3 className="font-semibold text-sm">Recent Entries</h3>
                  </div>
                  <button
                    onClick={() => router.push('records')}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y">
                  {recentEntryReceipts.length > 0 ? (
                    recentEntryReceipts.map((receipt) => (
                      <div
                        key={receipt.id}
                        className="p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                            #{receipt.receiptNo}
                          </span>
                          <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                            Stored
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-700">
                              {getInitials(receipt.customer?.name || '?')}
                            </div>
                            <span className="text-sm font-medium text-foreground truncate max-w-[100px]">
                              {receipt.customer?.name}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Truck className="w-3 h-3" /> {receipt.carNo}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState label="No entries" />
                  )}
                </div>
              </div>

              {/* Clearances Column */}
              <div className="bg-card rounded-xl border shadow-sm flex flex-col h-full">
                <div className="p-4 border-b flex items-center justify-between bg-muted/10">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-purple-600" />
                    <h3 className="font-semibold text-sm">Recent Clearances</h3>
                  </div>
                  <button
                    onClick={() => router.push('clearance')}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y">
                  {recentClearanceReceipts.length > 0 ? (
                    recentClearanceReceipts.map((receipt) => (
                      <div
                        key={receipt.id}
                        className="p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-foreground">
                              {receipt.customer?.name}
                            </h4>
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {receipt.clearanceDate
                              ? new Date(
                                  receipt.clearanceDate
                                ).toLocaleDateString(undefined, {
                                  month: 'numeric',
                                  day: 'numeric',
                                })
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            #{receipt.clearanceNo}
                          </span>
                          <div className="flex items-center gap-1 text-purple-600">
                            Success <ArrowUpRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState label="No clearances" />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Sub-components for cleaner code

function EmptyState({ label }: { label: string }) {
  return (
    <div className="p-8 flex flex-col items-center justify-center text-muted-foreground space-y-2">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
        <MoreHorizontal className="w-4 h-4 opacity-50" />
      </div>
      <span className="text-xs">{label}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl border bg-card p-4">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[300px] rounded-xl border bg-card">
            <div className="p-4 border-b">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="p-4 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
