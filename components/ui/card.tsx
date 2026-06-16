import { cn } from "@/lib/utils";

interface CardProps {
  children:  React.ReactNode;
  className?: string;
  padding?:   boolean;
  accent?:    boolean; // adds 2px gold top border per design spec
}

export function Card({ children, className, padding = true, accent = false }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg border shadow-card",
        "border-[#E7E5DF]",
        accent && "border-t-2 border-t-[#F2B713]",
        padding && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title:     string;
  subtitle?: string;
  action?:   React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 mb-4", className)}>
      <div>
        <h3 className="text-[14px] font-semibold text-[#0C2138]">{title}</h3>
        {subtitle && <p className="text-[12px] text-[#94A3B8] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-[0.12em] text-[#94A3B8] uppercase mb-3">
      {children}
    </p>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("border-t border-[#E7E5DF]", className)} />;
}
