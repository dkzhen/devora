import { RAISE_MULTIPLIERS } from '@/constants/airdrops.constants';

/**
 * Format time input to "X minutes" format
 * @param {string} rawTime - Raw time input
 * @returns {string} Formatted time string
 */
export function formatTime(rawTime) {
  if (!rawTime) return '';
  return `${rawTime.replace(/[^0-9]/g, '')} minutes`;
}

/**
 * Format cost input with currency symbol
 * @param {string} rawCost - Raw cost input
 * @param {string} currencyType - Currency type ('$' or 'Rp')
 * @returns {string} Formatted cost string
 */
export function formatCost(rawCost, currencyType = '$') {
  if (!rawCost) return `${currencyType}0`;
  const numericValue = rawCost.replace(/[^0-9]/g, '');
  return currencyType === '$' ? `$${numericValue}` : `Rp.${numericValue}`;
}

/**
 * Format raise amount with $ prefix
 * @param {string} rawRaise - Raw raise input
 * @returns {string} Formatted raise string
 */
export function formatRaise(rawRaise) {
  if (!rawRaise) return '';
  return `$${rawRaise.trim().replace(/^\$*/, '')}`;
}

/**
 * Extract active links from form data
 * @param {FormData} formData - Form data object
 * @returns {Array} Array of link objects with name and url
 */
export function extractActiveLinks(formData) {
  const linksData = {
    web: formData.get('linkWeb'),
    x: formData.get('linkX'),
    github: formData.get('linkGit'),
    telegram: formData.get('linkTele'),
    discord: formData.get('linkDiscord'),
  };

  return Object.entries(linksData)
    .filter(([_, url]) => url && url.trim() !== '')
    .map(([name, url]) => ({ name, url }));
}

/**
 * Get unique categories from tasks or taskType string
 * @param {Object} airdrop - Airdrop object
 * @returns {Array} Array of unique category strings
 */
export function getUniqueCategories(airdrop) {
  let categories = [];
  
  if (airdrop.tasks && airdrop.tasks.length > 0) {
    categories = airdrop.tasks.map(t => t.category.trim());
  } else if (airdrop.taskType) {
    categories = airdrop.taskType.split(',').map(t => t.trim());
  }

  const seen = new Set();
  return categories.filter(c => {
    const lower = c.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

/**
 * Get all unique task types from airdrops array
 * @param {Array} airdrops - Array of airdrop objects
 * @returns {Array} Sorted array of unique task types
 */
export function getAllUniqueTaskTypes(airdrops) {
  return Array.from(
    new Set(
      airdrops.flatMap(a => {
        if (a.tasks && a.tasks.length > 0) {
          return a.tasks.map(t => t.category.trim().toLowerCase());
        } else if (a.taskType) {
          return a.taskType.split(',').map(t => t.trim().toLowerCase());
        }
        return [];
      })
    )
  ).sort();
}

/**
 * Calculate average raised amount from airdrops
 * @param {Array} airdrops - Array of airdrop objects
 * @returns {Object} Object with avgRaised and formattedRaised
 */
export function calculateAverageRaised(airdrops) {
  let projectsWithRaiseData = 0;
  
  const totalRaised = airdrops.reduce((sum, airdrop) => {
    if (!airdrop.raise) return sum;
    
    const valueStr = airdrop.raise.replace(/[^0-9.MBKkmb]/g, '').toUpperCase();
    const numericVal = parseFloat(valueStr.replace(/[^0-9.]/g, ''));
    
    if (isNaN(numericVal)) return sum;
    
    projectsWithRaiseData++;
    
    if (valueStr.includes('B')) {
      return sum + (numericVal * RAISE_MULTIPLIERS.B);
    } else if (valueStr.includes('K')) {
      return sum + (numericVal * RAISE_MULTIPLIERS.K);
    }
    return sum + numericVal;
  }, 0);

  const avgRaised = projectsWithRaiseData > 0 ? (totalRaised / projectsWithRaiseData) : 0;
  
  const formattedRaised = avgRaised > 0
    ? `$${avgRaised >= 1000 ? (avgRaised / 1000).toFixed(2) + 'B' : avgRaised.toFixed(1) + 'M'}`
    : '$0M';

  return { avgRaised, formattedRaised };
}

/**
 * Filter airdrops based on multiple criteria
 * @param {Array} airdrops - Array of airdrop objects
 * @param {Object} filters - Filter criteria object
 * @returns {Array} Filtered airdrops array
 */
export function filterAirdrops(airdrops, filters) {
  const { nameFilter, globalSearch, taskTypeFilter, statusFilter, visibilityFilter } = filters;

  return airdrops.filter(airdrop => {
    // Name filter
    const matchesName = airdrop.name.toLowerCase().includes(nameFilter.toLowerCase());

    // Global search
    let dynamicTaskCategories = '';
    if (airdrop.tasks && airdrop.tasks.length > 0) {
      dynamicTaskCategories = Array.from(
        new Set(airdrop.tasks.map(t => t.category.toLowerCase()))
      ).join(' ');
    }
    const searchStr = `${airdrop.name} ${airdrop.taskType || ''} ${dynamicTaskCategories} ${airdrop.stage || ''} ${airdrop.status || ''}`.toLowerCase();
    const matchesGlobal = searchStr.includes(globalSearch.toLowerCase());

    // Task type filter
    let projectCategories = [];
    if (airdrop.tasks && airdrop.tasks.length > 0) {
      projectCategories = Array.from(
        new Set(airdrop.tasks.map(t => t.category.trim().toLowerCase()))
      );
    } else if (airdrop.taskType) {
      projectCategories = airdrop.taskType.split(',').map(t => t.trim().toLowerCase());
    }
    const matchesTaskType = taskTypeFilter === '' || projectCategories.includes(taskTypeFilter.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === '' || airdrop.status === statusFilter;

    // Visibility filter
    let matchesVisibility = true;
    if (visibilityFilter === 'public') {
      matchesVisibility = airdrop.isPublic === true;
    } else if (visibilityFilter === 'private') {
      matchesVisibility = !airdrop.isPublic && airdrop.publishStatus !== 'PENDING';
    } else if (visibilityFilter === 'pending') {
      matchesVisibility = !airdrop.isPublic && airdrop.publishStatus === 'PENDING';
    }

    return matchesName && matchesGlobal && matchesTaskType && matchesStatus && matchesVisibility;
  });
}

/**
 * Check if task deadline has passed
 * @param {Object} task - Task object with deadline
 * @returns {Object} Task with updated status if needed
 */
export function checkTaskDeadline(task) {
  if (task.status === 'Open' && task.deadline) {
    const now = new Date();
    const deadlineDate = new Date(task.deadline);
    deadlineDate.setHours(23, 59, 59, 999);
    
    if (now > deadlineDate) {
      return { ...task, status: 'Closed' };
    }
  }
  return task;
}

/**
 * Process tasks array to check deadlines
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Processed tasks with updated statuses
 */
export function processTaskDeadlines(tasks) {
  return tasks.map(checkTaskDeadline);
}

/**
 * Get link URL by type from airdrop links array
 * @param {Array} links - Array of link objects
 * @param {string} type - Link type to find
 * @returns {string} URL or empty string
 */
export function getLinkByType(links, type) {
  if (!links || !Array.isArray(links)) return '';
  const link = links.find(l => l.name === type);
  return link ? link.url : '';
}

/**
 * Count airdrops by status
 * @param {Array} airdrops - Array of airdrop objects
 * @param {string} status - Status to count
 * @returns {number} Count of airdrops with given status
 */
export function countByStatus(airdrops, status) {
  return airdrops.filter(a => a.status === status).length;
}

/**
 * Format date to locale string
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale string (default: 'en-GB')
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, locale = 'en-GB', options = { day: '2-digit', month: 'short' }) {
  if (!date) return '';
  return new Date(date).toLocaleDateString(locale, options);
}
