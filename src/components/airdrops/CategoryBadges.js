import { getUniqueCategories } from '@/lib/utils/airdrops.utils';

export default function CategoryBadges({ airdrop, maxDisplay = 2 }) {
  const categories = getUniqueCategories(airdrop);

  if (categories.length === 0) {
    return <span className="text-sm text-slate-500">-</span>;
  }

  const displayedCategories = categories.slice(0, maxDisplay);
  const hiddenCategories = categories.slice(maxDisplay);

  return (
    <>
      {displayedCategories.map((category, idx) => (
        <span 
          key={idx} 
          className="px-2 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700"
        >
          {category.toUpperCase()}
        </span>
      ))}
      {hiddenCategories.length > 0 && (
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          +{hiddenCategories.length}
        </span>
      )}
    </>
  );
}
