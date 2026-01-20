import { Icons } from "@/components/icons";
import { Card } from "@/components/ui/card";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

const DATE_PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 3 months", days: 90 },
  { label: "Last year", days: 365 },
];

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  viewMode: "grid" | "timeline";
  setViewMode: (mode: "grid" | "timeline") => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  sortOrder: "newest" | "oldest";
  setSortOrder: (order: "newest" | "oldest") => void;
  memoryTypes: Array<{ value: string; label: string; icon: React.ComponentType<{ className?: string }> }>;
  dateRange?: { startDate?: string; endDate?: string };
  setDateRange?: (range: { startDate?: string; endDate?: string }) => void;
}

export function FilterBar({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  viewMode,
  setViewMode,
  typeFilter,
  setTypeFilter,
  sortOrder,
  setSortOrder,
  memoryTypes,
  dateRange = {},
  setDateRange,
}: FilterBarProps) {
  const hasDateFilter = dateRange.startDate || dateRange.endDate;

  const clearDateRange = () => {
    setDateRange?.({});
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <label htmlFor="memories-search" className="sr-only">Search memories</label>
        <input
          id="memories-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search memories..."
          className="w-full px-4 py-3 pl-11 rounded-xl bg-muted/50 backdrop-blur-sm border-none focus:ring-2 focus:ring-primary outline-none transition-all"
        />
        <Icons.Image className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            aria-label="Clear search"
          >
            <Icons.Close className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Filter Toggle & View Mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showFilters ? "bg-primary text-primary-foreground glow-soft" : "bg-muted/50 backdrop-blur-sm text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icons.Settings className="w-4 h-4" />
            Filters
          </button>
          
          {/* Active filter indicators */}
          {hasDateFilter && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
              <Icons.Calendar className="w-3 h-3" />
              <span>Date filter active</span>
              <button
                onClick={clearDateRange}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
              >
                <Icons.Close className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 bg-muted/50 backdrop-blur-sm rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === "grid"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === "timeline"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <Card className="p-4 animate-in slide-in-from-top-2 duration-200 aurora-card">
          <div className="flex flex-col gap-4">
            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Memory Type
              </label>
              <div className="flex flex-wrap gap-2">
                {memoryTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setTypeFilter(type.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        typeFilter === type.value
                          ? "bg-primary text-primary-foreground glow-soft"
                          : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Range Filter */}
            {setDateRange && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Date Range
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="date-range-start" className="text-xs text-muted-foreground">From:</label>
                    <input
                      id="date-range-start"
                      type="date"
                      value={dateRange.startDate || ""}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value || undefined })}
                      className="px-3 py-2 rounded-lg bg-muted text-foreground text-sm border-none focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="date-range-end" className="text-xs text-muted-foreground">To:</label>
                    <input
                      id="date-range-end"
                      type="date"
                      value={dateRange.endDate || ""}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value || undefined })}
                      className="px-3 py-2 rounded-lg bg-muted text-foreground text-sm border-none focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  {hasDateFilter && (
                    <button
                      onClick={clearDateRange}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
                    >
                      Clear dates
                    </button>
                  )}
                </div>
                {/* Quick date presets */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <DatePresetButtons 
                    dateRange={dateRange} 
                    setDateRange={setDateRange} 
                  />
                </div>
              </div>
            )}

            {/* Sort Order */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Sort By
              </label>
              <div className="flex gap-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortOrder(option.value as "newest" | "oldest")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      sortOrder === option.value
                        ? "bg-primary text-primary-foreground glow-soft"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Separate component to handle date calculations in event handlers (not during render)
function DatePresetButtons({ 
  dateRange, 
  setDateRange 
}: { 
  dateRange: { startDate?: string; endDate?: string };
  setDateRange: (range: { startDate?: string; endDate?: string }) => void;
}) {
  const handlePresetClick = (days: number) => {
    const now = new Date();
    const endDate = now.toISOString().split("T")[0];
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setDateRange({ startDate, endDate });
  };

  // Check if a preset is active - we compute this based on the difference in days
  const getIsActive = (days: number) => {
    if (!dateRange.startDate || !dateRange.endDate) return false;
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    // Check if the end date is today (or very close)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const isEndToday = Math.abs(end.getTime() - today.getTime()) < 24 * 60 * 60 * 1000;
    return isEndToday && Math.abs(diffDays - days) <= 1;
  };

  return (
    <>
      {DATE_PRESETS.map((preset) => {
        const isActive = getIsActive(preset.days);
        return (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset.days)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </>
  );
}
