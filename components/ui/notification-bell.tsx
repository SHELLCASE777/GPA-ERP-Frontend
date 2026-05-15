"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { notificationsApi } from "@/lib/api";
import type { Notification } from "@/lib/types";

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Unread count (polls every 30 s) ────────────────────────────────────────
  const { data: countData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => notificationsApi.unreadCount().then((r) => r.data),
    refetchInterval: 30_000,
  });

  // ── Full list (only fetched when panel is open) ────────────────────────────
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list().then((r) => r.data),
    enabled: open,
    refetchInterval: open ? 30_000 : false,
  });

  // ── Mark one read ──────────────────────────────────────────────────────────
  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  // ── Mark all read ──────────────────────────────────────────────────────────
  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadCount = countData?.count ?? 0;

  function handleNotificationClick(notif: Notification) {
    if (!notif.is_read) {
      markRead.mutate(notif.id);
    }
    if (notif.link) {
      setOpen(false);
      router.push(notif.link);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        aria-label="Notifikasi"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 flex flex-col bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <span className="text-sm font-semibold text-gray-800">Notifikasi</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  <Check size={11} />
                  Baca semua
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              /* Loading spinner */
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : !notifications || notifications.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                <Bell size={24} className="opacity-40" />
                <p className="text-xs">Belum ada notifikasi</p>
              </div>
            ) : (
              /* Notification list */
              <ul>
                {notifications.map((notif) => (
                  <li key={notif.id}>
                    <button
                      onClick={() => handleNotificationClick(notif)}
                      className={[
                        "w-full text-left px-4 py-3 flex flex-col gap-0.5 hover:bg-gray-50 transition-colors border-b border-gray-50",
                        !notif.is_read
                          ? "border-l-2 border-l-blue-500 bg-blue-50/30"
                          : "border-l-2 border-l-transparent bg-white",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "text-sm leading-snug",
                          !notif.is_read ? "font-semibold text-gray-900" : "font-medium text-gray-700",
                        ].join(" ")}
                      >
                        {notif.title}
                      </span>
                      <span className="text-xs text-gray-500 leading-snug line-clamp-2">
                        {notif.body}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {relativeTime(notif.created_at)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
