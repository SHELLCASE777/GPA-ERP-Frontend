"use client";
import { useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/utils";

/**
 * Blocking overlay shown when the logged-in user has `must_change_password`.
 * The user reached here by logging in with an admin-issued temporary password,
 * so we ask for that temp password + a new one and reuse the standard
 * change-password endpoint. No way to dismiss until the change succeeds.
 */
export function ForcePasswordChange() {
  const { user, refreshUser } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = useMutation({
    mutationFn: () => usersApi.updatePassword({ current_password: current, new_password: next }),
    onSuccess: async () => { await refreshUser(); },
    onError: (e) => setError(getErrorMessage(e)),
  });

  if (!user?.must_change_password) return null;

  function submit() {
    setError(null);
    if (next.length < 8) { setError("Password baru minimal 8 karakter"); return; }
    if (!/[A-Z]/.test(next)) { setError("Harus mengandung minimal satu huruf kapital"); return; }
    if (!/[0-9]/.test(next)) { setError("Harus mengandung minimal satu angka"); return; }
    if (next !== confirm) { setError("Konfirmasi password tidak cocok"); return; }
    change.mutate();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center gap-2 mb-2">
          <KeyRound size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-gray-900">Ganti Password</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Password Anda telah direset. Untuk keamanan, silakan buat password baru sebelum melanjutkan.
        </p>
        <div className="space-y-3">
          {[
            { label: "Password sementara", value: current, set: setCurrent },
            { label: "Password baru",       value: next,    set: setNext },
            { label: "Konfirmasi password", value: confirm, set: setConfirm },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                {label === "Password baru" && (
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button
            variant="primary"
            className="w-full"
            onClick={submit}
            disabled={change.isPending || !current || !next || !confirm}
          >
            {change.isPending ? "Menyimpan…" : "Simpan Password Baru"}
          </Button>
        </div>
      </div>
    </div>
  );
}
