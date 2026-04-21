import { AlertCircle, AlertTriangle, CheckCircle, Info, Lightbulb } from 'lucide-react';

const types = {
  info: {
    icon: Info,
    className: 'border-blue-500/50 bg-blue-500/10 text-blue-300',
    iconClassName: 'text-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
    iconClassName: 'text-amber-500',
  },
  danger: {
    icon: AlertCircle,
    className: 'border-red-500/50 bg-red-500/10 text-red-300',
    iconClassName: 'text-red-500',
  },
  success: {
    icon: CheckCircle,
    className: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
    iconClassName: 'text-emerald-500',
  },
  tip: {
    icon: Lightbulb,
    className: 'border-purple-500/50 bg-purple-500/10 text-purple-300',
    iconClassName: 'text-purple-500',
  },
};

export function Callout({ type = 'info', title, children }) {
  const config = types[type] || types.info;
  const Icon = config.icon;

  return (
    <div className={`not-prose my-6 flex gap-3 rounded-lg border p-4 ${config.className}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconClassName}`} />
      <div className="flex-1 space-y-2">
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-sm [&>p]:m-0">{children}</div>
      </div>
    </div>
  );
}
