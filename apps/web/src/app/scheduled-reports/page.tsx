"use client";

import { useState, useEffect, useCallback } from "react";
import { MobileContainer } from "@/components/layout/mobile-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { api, ScheduledReport, CreateScheduledReportDto, ReportFrequency } from "@/lib/api-client";

const frequencyOptions: { value: ReportFrequency; label: string }[] = [
  { value: ReportFrequency.DAILY, label: "Daily" },
  { value: ReportFrequency.WEEKLY, label: "Weekly" },
  { value: ReportFrequency.MONTHLY, label: "Monthly" },
];

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function ScheduledReportsPage() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const fetchReports = useCallback(async () => {
    try {
      setError(null);
      const response = await api.scheduledReports.list();
      setReports(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scheduled reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const toggleReport = async (id: string, currentActive: boolean) => {
    setTogglingIds((prev) => new Set(prev).add(id));
    try {
      const updatedReport = await api.scheduledReports.toggle(id, !currentActive);
      setReports((prev) =>
        prev.map((r) => (r.id === id ? updatedReport : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle scheduled report");
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const deleteReport = async (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await api.scheduledReports.delete(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete scheduled report");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleAddReport = async (data: CreateScheduledReportDto) => {
    try {
      const newReport = await api.scheduledReports.create(data);
      setReports((prev) => [newReport, ...prev]);
      setShowAddModal(false);
    } catch (err) {
      throw err;
    }
  };

  const handleEditReport = async (id: string, data: Partial<CreateScheduledReportDto>) => {
    try {
      const updatedReport = await api.scheduledReports.update(id, data);
      setReports((prev) =>
        prev.map((r) => (r.id === id ? updatedReport : r))
      );
      setEditingReport(null);
    } catch (err) {
      throw err;
    }
  };

  const formatSchedule = (report: ScheduledReport): string => {
    const time = report.time;
    switch (report.frequency) {
      case "daily":
        return `Daily at ${time}`;
      case "weekly":
        const day = daysOfWeek.find((d) => d.value === report.dayOfWeek)?.label || "Unknown";
        return `Every ${day} at ${time}`;
      case "monthly":
        const dayOfMonth = report.dayOfMonth || 1;
        const suffix = getDaySuffix(dayOfMonth);
        return `Monthly on the ${dayOfMonth}${suffix} at ${time}`;
      default:
        return time;
    }
  };

  const getDaySuffix = (day: number): string => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <MobileContainer>
        <div className="p-6 space-y-6 animate-slide-up">
          {/* Page Header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <Icons.Calendar className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-heading font-bold text-foreground">Scheduled Reports</h1>
              <p className="text-muted-foreground text-sm">Automatic report delivery</p>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="p-6 space-y-6 animate-slide-up">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <Icons.Calendar className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-heading font-bold text-foreground">Scheduled Reports</h1>
              <p className="text-muted-foreground text-sm">Automatic report delivery</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} variant="glow" size="icon" className="rounded-full h-12 w-12">
            <Icons.Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Card variant="default" className="overflow-hidden border-red-200 dark:border-red-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 dark:bg-red-950/50 dark:text-red-400">
                  <Icons.Close className="w-5 h-5" />
                </div>
                <p className="text-red-700 dark:text-red-400 flex-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="w-8 h-8 rounded-full hover:bg-red-100 dark:hover:bg-red-950/50 flex items-center justify-center text-red-500 transition-colors"
                >
                  <Icons.Close className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Schedules</h2>
          
          {reports.length === 0 ? (
            <Card variant="glass" className="overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Icons.Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground mb-2">No scheduled reports yet</h3>
                <p className="text-muted-foreground mb-6 max-w-xs">
                  Set up automatic report delivery to your email
                </p>
                <Button onClick={() => setShowAddModal(true)} variant="glow" className="gap-2">
                  <Icons.Plus className="w-4 h-4" />
                  Create Schedule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const isToggling = togglingIds.has(report.id);
                const isDeleting = deletingIds.has(report.id);
                
                return (
                  <Card 
                    key={report.id} 
                    variant="default" 
                    className={`overflow-hidden transition-opacity ${isDeleting ? 'opacity-50' : ''}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 dark:bg-blue-950/50">
                          <Icons.Report className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading font-semibold text-foreground">{report.name}</h3>
                            {!report.isActive && (
                              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                Paused
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{report.email}</p>
                          <p className="text-xs text-primary font-medium mt-1">
                            {formatSchedule(report)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Toggle Switch */}
                          <button
                            onClick={() => toggleReport(report.id, report.isActive)}
                            disabled={isToggling || isDeleting}
                            className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                              report.isActive 
                                ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" 
                                : "bg-muted"
                            } ${isToggling ? 'opacity-50' : ''} focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                          >
                            <div
                              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                                report.isActive ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => setEditingReport(report)}
                            disabled={isDeleting}
                            className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <Icons.Settings className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => deleteReport(report.id)}
                            disabled={isDeleting || isToggling}
                            className={`w-9 h-9 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/50 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${isDeleting ? 'opacity-50' : ''}`}
                          >
                            {isDeleting ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                            ) : (
                              <Icons.Trash className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Schedule Info */}
                      <div className="flex gap-6 text-xs text-muted-foreground border-t border-muted/50 mt-4 pt-4">
                        <div className="flex items-center gap-1.5">
                          <Icons.Clock className="w-3.5 h-3.5" />
                          <span>Last sent: {formatDate(report.lastSentAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Icons.Calendar className="w-3.5 h-3.5" />
                          <span>Next: {formatDate(report.nextScheduledAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <ScheduledReportModal
            onClose={() => setShowAddModal(false)}
            onSave={handleAddReport}
          />
        )}

        {/* Edit Modal */}
        {editingReport && (
          <ScheduledReportModal
            report={editingReport}
            onClose={() => setEditingReport(null)}
            onSave={(data) => handleEditReport(editingReport.id, data)}
          />
        )}
      </div>
    </MobileContainer>
  );
}

function ScheduledReportModal({
  report,
  onClose,
  onSave,
}: {
  report?: ScheduledReport;
  onClose: () => void;
  onSave: (data: CreateScheduledReportDto) => Promise<void>;
}) {
  const [name, setName] = useState(report?.name || "");
  const [email, setEmail] = useState(report?.email || "");
  const [frequency, setFrequency] = useState<ReportFrequency>(report?.frequency || ReportFrequency.WEEKLY);
  const [dayOfWeek, setDayOfWeek] = useState(report?.dayOfWeek ?? 1);
  const [dayOfMonth, setDayOfMonth] = useState(report?.dayOfMonth ?? 1);
  const [time, setTime] = useState(report?.time || "09:00");
  const [isActive, setIsActive] = useState(report?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!report;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !time) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data: CreateScheduledReportDto = {
        name: name.trim(),
        email: email.trim(),
        frequency,
        time,
        isActive,
      };

      if (frequency === "weekly") {
        data.dayOfWeek = dayOfWeek;
      } else if (frequency === "monthly") {
        data.dayOfMonth = dayOfMonth;
      }

      await onSave(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save scheduled report");
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card variant="default" className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Icons.Calendar className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {isEditing ? "Edit Schedule" : "New Scheduled Report"}
                </CardTitle>
                <CardDescription>
                  {isEditing ? "Update your report settings" : "Set up automatic delivery"}
                </CardDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Icons.Close className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Report Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekly Summary"
                className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground placeholder:text-muted-foreground"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground placeholder:text-muted-foreground"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {frequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFrequency(option.value)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      frequency === option.value
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-muted bg-muted/50 hover:border-primary/50 text-foreground"
                    }`}
                    disabled={isSubmitting}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {frequency === "weekly" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Day of Week
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground"
                  disabled={isSubmitting}
                >
                  {daysOfWeek.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {frequency === "monthly" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Day of Month
                </label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground"
                  disabled={isSubmitting}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none transition-shadow text-foreground"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50">
              <label className="text-sm font-medium text-foreground">
                Active
              </label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                disabled={isSubmitting}
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                  isActive 
                    ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" 
                    : "bg-muted"
                } focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex gap-3 mt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 rounded-xl" 
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="glow"
                className="flex-1 rounded-xl" 
                disabled={isSubmitting || !name.trim() || !email.trim()}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditing ? "Saving..." : "Creating..."}
                  </div>
                ) : (
                  isEditing ? "Save Changes" : "Create Schedule"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
