import { PUBLISH_STATUS } from '@/constants/airdrops.constants';

export default function VisibilityBadge({ isPublic, publishStatus }) {
  if (isPublic) return null;

  if (publishStatus === PUBLISH_STATUS.PENDING) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400 font-medium">
        PENDING
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-400 font-medium">
      PRIVATE
    </span>
  );
}
