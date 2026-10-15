/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  api,
  getStoredToken,
  getStoredUser,
} from './services/api';
import {
  User,
  MetaResponse,
  FactRecord,
  SummaryResponse,
  FilterState,
  TabKey,
} from './types';
import { calculateAggregatedSummary } from './utils/aggregation';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { TabsNavigation } from './components/TabsNavigation';
import { ExecutiveSummaryTab } from './components/ExecutiveSummaryTab';
import { AmPerformanceTab } from './components/AmPerformanceTab';
import { BoPerformanceTab } from './components/BoPerformanceTab';
import { PrincipalPerformanceTab } from './components/PrincipalPerformanceTab';
import { RankingsTab } from './components/RankingsTab';
import { BoDetailDrawer } from './components/BoDetailDrawer';
import { SkuModal } from './components/SkuModal';
import { LoginPage } from './components/LoginPage';
import { AlertCircle, ShieldAlert, X } from 'lucide-react';

export default function App() {
  // Authentication state
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  // Active tab state
  const [activeTab, setActiveTab] = useState<TabKey>('executive');

  // Filter state
  const [filter, setFilter] = useState<FilterState>({
    bulan_no: null,
    am_code: null,
    bo_code: null,
    principal: null,
  });

  // Selected BO for Drawer
  const [selectedBoDrawer, setSelectedBoDrawer] = useState<string | null>(null);

  // SKU Modal visibility
  const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);

  // App data state
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [rawFacts, setRawFacts] = useState<FactRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Toast notifications (e.g. for 403 Forbidden or network info)
  const [toastMessage, setToastMessage] = useState<{
    type: 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  // Initialize or re-sync user AM restrictions
  useEffect(() => {
    if (user && user.role === 'am' && user.am_code) {
      setFilter((prev) => ({
        ...prev,
        am_code: user.am_code || null,
      }));
    }
  }, [user]);

  // Listen to 401 & 403 window events
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setToastMessage({
        type: 'warning',
        text: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.',
      });
    };

    const handleForbidden = () => {
      setToastMessage({
        type: 'error',
        text: 'Akses Ditolak: Anda tidak memiliki wewenang untuk tindakan ini.',
      });
    };

    window.addEventListener('q4:auth_unauthorized', handleUnauthorized);
    window.addEventListener('q4:auth_forbidden', handleForbidden);

    return () => {
      window.removeEventListener('q4:auth_unauthorized', handleUnauthorized);
      window.removeEventListener('q4:auth_forbidden', handleForbidden);
    };
  }, []);

  // Fetch initial data: Meta & Facts
  const loadInitialData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [metaRes, factsRes] = await Promise.all([
        api.getMeta(),
        api.getFacts(),
      ]);
      setMeta(metaRes);
      setRawFacts(factsRes.data || []);
    } catch (err: unknown) {
      const errObj = err as Error;
      setToastMessage({
        type: 'error',
        text: errObj.message || 'Gagal memuat data dari server.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token, loadInitialData]);

  // Handle Logout
  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setToken(null);
    setRawFacts([]);
    setMeta(null);
    setSelectedBoDrawer(null);
  };

  // Filter facts based on User Role (AM restriction) and Global Filters
  const filteredFacts = useMemo(() => {
    return rawFacts.filter((f) => {
      // 1. Hard Role Boundary: AM users can NEVER see other regions
      if (user?.role === 'am' && user.am_code && f.am_code !== user.am_code) {
        return false;
      }
      // 2. AM filter (from UI for Direktur)
      if (filter.am_code && f.am_code !== filter.am_code) {
        return false;
      }
      // 3. BO filter
      if (filter.bo_code && f.bo_code !== filter.bo_code) {
        return false;
      }
      // 4. Principal filter
      if (filter.principal && f.principal !== filter.principal) {
        return false;
      }
      // 5. Month filter (10, 11, 12, or all Q4 if null)
      if (filter.bulan_no && f.bulan_no !== filter.bulan_no) {
        return false;
      }
      return true;
    });
  }, [rawFacts, user, filter]);

  // Calculate live summary on client from filtered facts for instant performance
  const calculatedSummary: SummaryResponse = useMemo(() => {
    return calculateAggregatedSummary(
      filteredFacts,
      filter.bulan_no,
      filter.am_code,
      filter.bo_code,
      filter.principal
    );
  }, [filteredFacts, filter]);

  // Drilldown handler from AM row click -> switch to BO tab and set AM filter
  const handleSelectAm = (amCode: string) => {
    setFilter((prev) => ({
      ...prev,
      am_code: amCode,
      bo_code: null,
    }));
    setActiveTab('bo');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilter({
      bulan_no: null,
      am_code: user?.role === 'am' ? user.am_code || null : null,
      bo_code: null,
      principal: null,
    });
  };

  // If user is not logged in, render corporate login page
  if (!token || !user) {
    return (
      <LoginPage
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          setToken(getStoredToken());
          if (loggedUser.role === 'am' && loggedUser.am_code) {
            setFilter((prev) => ({ ...prev, am_code: loggedUser.am_code || null }));
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Toast Notification Alert Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-medium border animate-in slide-in-from-bottom duration-300 max-w-md ${
            toastMessage.type === 'error'
              ? 'bg-red-900 text-red-50 border-red-700'
              : toastMessage.type === 'warning'
              ? 'bg-amber-900 text-amber-50 border-amber-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="flex-1">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/20 rounded transition-colors text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <Header
        user={user}
        meta={meta}
        onRefresh={loadInitialData}
        onLogout={handleLogout}
        onOpenSkuModal={() => setIsSkuModalOpen(true)}
        isLoading={isLoading}
      />

      {/* Sticky Global Filter Bar */}
      <FilterBar
        user={user}
        meta={meta}
        filter={filter}
        onFilterChange={(newVals) => setFilter((prev) => ({ ...prev, ...newVals }))}
        onResetFilters={handleResetFilters}
      />

      {/* Navigation Tabs */}
      <TabsNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userRole={user.role}
      />

      {/* Main Content View Container */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {isLoading && rawFacts.length === 0 ? (
          /* High-fidelity Skeleton Loader */
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-28 bg-slate-200 rounded-xl" />
              ))}
            </div>
            <div className="h-20 bg-slate-200 rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 h-72 bg-slate-200 rounded-xl" />
              <div className="lg:col-span-5 h-72 bg-slate-200 rounded-xl" />
            </div>
          </div>
        ) : (
          <div>
            {/* Tab 1: Ringkasan Eksekutif */}
            {activeTab === 'executive' && (
              <ExecutiveSummaryTab
                summary={calculatedSummary}
                facts={filteredFacts}
                skuCount={meta?.excluded_skus?.length || 0}
                onOpenSkuModal={() => setIsSkuModalOpen(true)}
                onSelectPrincipalFilter={(pr) =>
                  setFilter((prev) => ({ ...prev, principal: pr }))
                }
              />
            )}

            {/* Tab 2: Kinerja per AM (Direktur only) */}
            {activeTab === 'am' && user.role === 'direktur' && (
              <AmPerformanceTab
                facts={filteredFacts}
                meta={meta}
                onSelectAm={handleSelectAm}
              />
            )}

            {/* Tab 3: Kinerja per Cabang (BO) */}
            {activeTab === 'bo' && (
              <BoPerformanceTab
                facts={filteredFacts}
                onOpenBoDrawer={(boCode) => setSelectedBoDrawer(boCode)}
              />
            )}

            {/* Tab 4: Kinerja per Principal */}
            {activeTab === 'principal' && (
              <PrincipalPerformanceTab
                facts={filteredFacts}
              />
            )}

            {/* Tab 5: Peringkat & Analisis (Direktur only) */}
            {activeTab === 'rankings' && user.role === 'direktur' && (
              <RankingsTab
                facts={filteredFacts}
                onOpenBoDrawer={(boCode) => setSelectedBoDrawer(boCode)}
              />
            )}
          </div>
        )}
      </main>

      {/* Slide-over Drawer for BO Details */}
      <BoDetailDrawer
        boCode={selectedBoDrawer}
        onClose={() => setSelectedBoDrawer(null)}
        facts={rawFacts}
      />

      {/* 4 SKU Excluded Transparency Modal */}
      <SkuModal
        isOpen={isSkuModalOpen}
        onClose={() => setIsSkuModalOpen(false)}
        skus={meta?.excluded_skus || []}
        excludedBruto={calculatedSummary.excluded_bruto}
        excludedNetto={calculatedSummary.excluded_netto}
      />
    </div>
  );
}
