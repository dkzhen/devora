'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';
import LoadingImage from '@/components/LoadingImage';
import {
  PROJECT_LIST,
  UI_CONSTANTS,
  CSS_CLASSES,
  BREADCRUMBS,
  PAGE_METADATA,
} from '@/constants/web3-projects.constants';

// Helper Functions
const getUserFromStorage = () => {
  try {
    const storedUser = localStorage.getItem('user_info');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

const filterProjects = (projects, searchTerm) => {
  const lowerSearch = searchTerm.toLowerCase();
  return projects.filter(
    (project) =>
      project.name.toLowerCase().includes(lowerSearch) ||
      project.description?.toLowerCase().includes(lowerSearch) ||
      project.category?.toLowerCase().includes(lowerSearch)
  );
};

const isProjectLocked = (user, projectSlug) => {
  return !user && projectSlug === 'nara-agent';
};

// Component: Search Bar
const SearchBar = ({ value, onChange }) => (
  <div className="relative group max-w-2xl mx-auto w-full">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <svg
        className="h-5 w-5 text-[#ffd89b]/60 group-focus-within:text-[#ffd89b] transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
    <input
      type="text"
      placeholder={UI_CONSTANTS.SEARCH_PLACEHOLDER}
      value={value}
      onChange={onChange}
      className={CSS_CLASSES.SEARCH_INPUT}
    />
  </div>
);

// Component: Project Logo
const ProjectLogo = ({ project, isLocked }) => (
  <div className={CSS_CLASSES.LOGO_CONTAINER}>
    <LoadingImage
      src={project.logo}
      alt={project.name}
      className={`w-full h-full object-contain p-2 ${isLocked ? 'grayscale' : ''}`}
      containerClassName="w-full h-full"
      fallback={UI_CONSTANTS.FALLBACK_ICON}
      loaderWrapperClassName="absolute inset-0 bg-amber-500/5 flex items-center justify-center"
      spinnerClassName="w-4 h-4 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin"
    />
  </div>
);

// Component: Project Header
const ProjectHeader = ({ project, isLocked }) => (
  <div className="flex-1 min-w-0">
    <h3
      className={`text-base font-bold text-white truncate uppercase tracking-wider transition-colors ${
        !isLocked && 'group-hover:text-[#ffd89b]'
      }`}
    >
      {project.name}
    </h3>
    <span className={CSS_CLASSES.CATEGORY_BADGE}>
      {project.category || UI_CONSTANTS.DEFAULT_CATEGORY}
    </span>
  </div>
);

// Component: Project Description
const ProjectDescription = ({ description }) => (
  <div className="relative z-10 mt-4 h-12 overflow-hidden">
    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-mono">
      {description}
    </p>
  </div>
);

// Component: Lock Icon
const LockIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

// Component: Arrow Icon
const ArrowIcon = () => (
  <svg
    className="w-3 h-3 group-hover:translate-x-1 transition-transform"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
  </svg>
);

// Component: Star Icon
const StarIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Component: Project Footer
const ProjectFooter = ({ isLocked, isFeatured }) => (
  <div className="relative z-10 mt-4 pt-4 border-t border-[#ffd89b]/10 flex items-center justify-between">
    {isLocked ? (
      <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1">
        <LockIcon />
        {UI_CONSTANTS.LOGIN_REQUIRED_TEXT}
      </div>
    ) : (
      <div className="text-[10px] font-black text-[#ffd89b] uppercase tracking-[0.2em] flex items-center gap-1">
        {UI_CONSTANTS.EXPLORE_TEXT}
        <ArrowIcon />
      </div>
    )}
    {isFeatured && (
      <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400/80">
        <StarIcon />
        {UI_CONSTANTS.FEATURED_TEXT}
      </span>
    )}
  </div>
);

// Component: Project Card
const ProjectCard = ({ project, user, onNavigate }) => {
  const isLocked = isProjectLocked(user, project.slug);
  const cardClassName = `${CSS_CLASSES.CARD_BASE} ${
    isLocked ? CSS_CLASSES.CARD_LOCKED : CSS_CLASSES.CARD_INTERACTIVE
  }`;

  const handleClick = () => {
    if (!isLocked) {
      onNavigate(project.slug);
    }
  };

  return (
    <div onClick={handleClick} className={cardClassName}>
      {!isLocked && <div className={CSS_CLASSES.HOVER_GRADIENT} />}

      <div className="relative z-10 flex items-start gap-4">
        <ProjectLogo project={project} isLocked={isLocked} />
        <ProjectHeader project={project} isLocked={isLocked} />
      </div>

      <ProjectDescription description={project.description} />
      <ProjectFooter isLocked={isLocked} isFeatured={project.isFeatured} />
    </div>
  );
};

// Main Component
export default function Web3ProjectsPage() {
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setUser(getUserFromStorage());
  }, []);

  const filteredProjects = filterProjects(PROJECT_LIST, search);

  const handleNavigate = (slug) => {
    router.push(`/web3-projects/${slug}`);
  };

  if (!mounted) {
    return <LoadingState message={PAGE_METADATA.LOADING_MESSAGE} />;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <HeroHeader
        breadcrumbs={BREADCRUMBS}
        title={PAGE_METADATA.TITLE}
        badge={PAGE_METADATA.BADGE}
        description={PAGE_METADATA.DESCRIPTION}
      />

      <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project, idx) => (
          <ProjectCard
            key={idx}
            project={project}
            user={user}
            onNavigate={handleNavigate}
          />
        ))}
      </div>
    </div>
  );
}
