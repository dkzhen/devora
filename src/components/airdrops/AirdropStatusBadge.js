import { STATUS_COLORS, AIRDROP_STATUS } from '@/constants/airdrops.constants';

export default function AirdropStatusBadge({ status, statusDate }) {
  const statusStyle = STATUS_COLORS[status] || 'bg-slate-700 text-slate-300 border-slate-600';

  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center w-fit px-2.5 py-1 rounded-lg text-xs font-medium border ${statusStyle}`}>
        {status ? status.toUpperCase() : 'POTENTIAL'}
      </span>
      {statusDate && (
        <span className="text-[10px] text-slate-500">
          {new Date(statusDate).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
