import { useState, useMemo } from 'react';
import { Application } from './useApplications';
import { FilterState } from '../components/ApplicationFilters';

export function useApplicationFilters(applications: Application[]) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    platform: 'all',
    sortOrder: 'newest',
  });

  // Extract unique platforms from applications
  const platforms = useMemo(() => {
    const platformSet = new Set<string>();
    applications.forEach((app) => {
      if (app.platform) {
        platformSet.add(app.platform);
      }
    });
    return Array.from(platformSet).sort();
  }, [applications]);

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // Search filter (case-insensitive)
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      result = result.filter(
        (app) =>
          app.company.toLowerCase().includes(searchLower) ||
          app.role.toLowerCase().includes(searchLower) ||
          (app.platform && app.platform.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter((app) => app.status === filters.status);
    }

    // Platform filter
    if (filters.platform !== 'all') {
      result = result.filter((app) => app.platform === filters.platform);
    }

    // Sort by applied date
    result.sort((a, b) => {
      const dateA = new Date(a.applied_date).getTime();
      const dateB = new Date(b.applied_date).getTime();
      return filters.sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [applications, filters]);

  return {
    filters,
    setFilters,
    filteredApplications,
    platforms,
  };
}
