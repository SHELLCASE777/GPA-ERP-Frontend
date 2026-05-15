"use client";
import { CommandItem } from "cmdk";
import { cn } from "@/lib/utils";

interface ResultItemProps {
  icon:     React.ReactNode;
  iconBg:   string;
  primary:  string;
  secondary?: string;
  badge?:   { label: string; cls: string };
  onSelect: () => void;
}

export function ResultItem({ icon, iconBg, primary, secondary, badge, onSelect }: ResultItemProps) {
  return (
    <CommandItem
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                 data-[selected=true]:bg-gray-100 transition-colors outline-none"
    >
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{primary}</p>
        {secondary && <p className="text-xs text-gray-400 truncate">{secondary}</p>}
      </div>
      {badge && (
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", badge.cls)}>
          {badge.label}
        </span>
      )}
    </CommandItem>
  );
}
