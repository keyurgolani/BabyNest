"use client";

import { useState, useEffect, useCallback } from "react";
import { MobileContainer } from "@/components/layout/mobile-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { api, ScheduledReport, CreateScheduledReportDto, ReportFrequency } from "@/lib/api-client";
import { 
  FileText, 
  Download, 
  Loader2, 
  Calendar, 
  Clock, 
  Mail, 
  Eye,
  Trash2,
  Utensils,
  Moon,
  TrendingUp,
  Heart,
  Award,
  FileBarChart,
  Send,
  History,
  CalendarClock,
  Zap,
  FileSpreadsheet,
  Printer,
  Share2,
  Sparkles
} from "lucide-react";

// Report type definitions
type ReportType = 'feeding' | 'sleep' | 'growth' | 'health' | 'development' | 'comprehensive';

interface ReportTypeConfig {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const reportTypes: ReportTypeConfig[] = [
  {
    id: 'feeding',
    name: 'Feeding Report',
    description: 'Feeding patterns, amounts, types, frequency',
    icon: <Utensils className="w-5 h-5" />,
    color: 'text-orange-500 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-950/50',
  },
  {
    id: 'sleep',
    name: 'Sleep Report',
    description: 'Sleep duration, patterns, quality trends',
    icon: <Moon className="w-5 h-5" />,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-950/50',
  },
  {
    id: 'growth',
    name: 'Growth Report',
    description: 'Weight, height, head circumference with percentiles',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'text-green-500 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-950/50',
  },
  {
    id: 'health',
    name: 'Health Summary',
    description: 'Symptoms, medications, vaccinations, doctor visits',
    icon: <Heart className="w-5 h-5" />,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-950/50',
  },
  {
    id: 'development',
    name: 'Development Report',
    description: 'Milestones achieved, upcoming milestones',
    icon: <Award className="w-5 h-5" />,
    color: 'text-purple-500 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-950/50',
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive Report',
    description: 'All of the above combined',
    icon: <FileBarChart className="w-5 h-5" />,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
];

// Quick generate presets
type QuickPreset = 'daily' | 'weekly' | 'monthly' | 'custom';

interface PastReport {
  id: string;
  name: string;
  reportType: ReportType;
  dateRange: { start: string; end: string };
  generatedAt: string;
  size: string;
}

// Mock past reports for demonstration
const mockPastReports: PastReport[] = [
  {
    id: '1',
    name: 'Weekly Summary',
    reportType: 'comprehensive',
    dateRange: { start: '2024-01-08', end: '2024-01-14' },
    generatedAt: '2024-01-14T10:30:00Z',
    size: '2.4 MB',
  },
  {
    id: '2',
    name: 'Monthly Growth Report',
    reportType: 'growth',
    dateRange: { start: '2024-01-01', end: '2024-01-31' },
    generatedAt: '2024-02-01T09:00:00Z',
    size: '1.8 MB',
  },
  {
    id: '3',
    name: 'Sleep Analysis',
    reportType: 'sleep',
    dateRange: { start: '2024-01-01', end: '2024-01-07' },
    generatedAt: '2024-01-07T18:00:00Z',
    size: '1.2 MB',
  },
];

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

type TabType = 'generate' | 'scheduled' | 'history';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('comprehensive');
  const [quickPreset, setQuickPreset] = useState<QuickPreset>('weekly');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);
  
  // Scheduled reports state
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [scheduledError, setScheduledError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Past reports state
  const [pastReports] = useState<PastReport[]>(mockPastReports);

  // Initialize dates on client side
  useEffect(() => {
    const today = new Date();
    setCurrentDate(today.toISOString().split('T')[0]);
    applyQuickPreset('weekly', today);
  }, []);

  const applyQuickPreset = (preset: QuickPreset, baseDate?: Date) => {
    const today = baseDate || new Date();
    const start = new Date(today);
    
    switch (preset) {
      case 'daily':
        start.setDate(today.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(today.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'custom':
        // Don't change dates for custom
        return;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
    setQuickPreset(preset);
  };

  // Fetch scheduled reports
  const fetchScheduledReports = useCallback(async () => {
    try {
      setScheduledError(null);
      const response = await api.scheduledReports.list();
      setScheduledReports(response);
    } catch (err) {
      setScheduledError(err instanceof Error ? err.message : "Failed to load scheduled reports");
    } finally {
      setLoadingScheduled(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduledReports();
  }, [fetchScheduledReports]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    
    try {
      const blob = await api.export.downloadPDFReport({
        startDate,
        endDate,
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `baby-report-${selectedReportType}-${startDate}-to-${endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      setDownloadError(error instanceof Error ? error.message : 'Failed to download PDF report');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadCSV = async () => {
    setIsDownloadingCSV(true);
    setDownloadError(null);
    
    try {
      let blob: Blob;
      
      if (selectedReportType === 'comprehensive') {
        blob = await api.export.downloadAllDataCSV({
          startDate,
          endDate,
        });
      } else {
        // Map UI report types to API Export types
        let category: string = selectedReportType;
        
        // Handle mapping differences
        if (selectedReportType === 'development') category = 'milestone';
        // 'health' is a composite in UI but we'll map to 'symptom' for now as a primary health indicator,
        // or we could use 'doctor_visit'. For now let's use 'symptom' and maybe later API supports 'health'
        // which aggregates all health data.
        if (selectedReportType === 'health') category = 'symptom';
        
        blob = await api.export.downloadCSV(category, {
          startDate,
          endDate,
        });
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `baby-report-${selectedReportType}-${startDate || 'all'}-to-${endDate || 'current'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download CSV:', error);
      setDownloadError(error instanceof Error ? error.message : 'Failed to download CSV report');
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress) return;
    setIsSendingEmail(true);
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSendingEmail(false);
    setEmailAddress("");
    alert(`Report would be sent to ${emailAddress}`);
  };

  const toggleScheduledReport = async (id: string, currentActive: boolean) => {
    setTogglingIds((prev) => new Set(prev).add(id));
    try {
      const updatedReport = await api.scheduledReports.toggle(id, !currentActive);
      setScheduledReports((prev) =>
        prev.map((r) => (r.id === id ? updatedReport : r))
      );
    } catch (err) {
      setScheduledError(err instanceof Error ? err.message : "Failed to toggle scheduled report");
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const deleteScheduledReport = async (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await api.scheduledReports.delete(id);
      setScheduledReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setScheduledError(err instanceof Error ? err.message : "Failed to delete scheduled report");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleAddScheduledReport = async (data: CreateScheduledReportDto) => {
    try {
      const newReport = await api.scheduledReports.create(data);
      setScheduledReports((prev) => [newReport, ...prev]);
      setShowAddModal(false);
    } catch (err) {
      throw err;
    }
  };

  const handleEditScheduledReport = async (id: string, data: Partial<CreateScheduledReportDto>) => {
    try {
      const updatedReport = await api.scheduledReports.update(id, data);
      setScheduledReports((prev) =>
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
    });
  };

  const getReportTypeConfig = (type: ReportType): ReportTypeConfig => {
    return reportTypes.find(r => r.id === type) || reportTypes[5];
  };

  return (
    <MobileContainer>
      <div className="p-4 space-y-6 animate-slide-up">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
            <FileText className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-heading font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground text-sm">Generate & schedule medical reports</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          <Button
            variant="ghost"
            onClick={() => setActiveTab('generate')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all h-auto",
              activeTab === 'generate'
                ? "bg-background text-foreground shadow-sm hover:bg-background"
                : "text-muted-foreground hover:text-foreground hover:bg-transparent"
            )}
          >
            <Zap className="w-4 h-4" />
            Generate
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('scheduled')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all h-auto",
              activeTab === 'scheduled'
                ? "bg-background text-foreground shadow-sm hover:bg-background"
                : "text-muted-foreground hover:text-foreground hover:bg-transparent"
            )}
          >
            <CalendarClock className="w-4 h-4" />
            Scheduled
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all h-auto",
              activeTab === 'history'
                ? "bg-background text-foreground shadow-sm hover:bg-background"
                : "text-muted-foreground hover:text-foreground hover:bg-transparent"
            )}
          >
            <History className="w-4 h-4" />
            History
          </Button>
        </div>

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-6">
            {/* Quick Generate Buttons */}
            <Card variant="glass" className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Quick Generate
                </CardTitle>
                <CardDescription>Select a time period for your report</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-4 gap-2">
                  {(['daily', 'weekly', 'monthly', 'custom'] as QuickPreset[]).map((preset) => (
                    <Button
                      key={preset}
                      variant="ghost"
                      onClick={() => applyQuickPreset(preset)}
                      className={cn(
                        "py-3 px-2 rounded-xl text-sm font-medium transition-all h-auto",
                        quickPreset === preset
                          ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      )}
                    >
                      {preset.charAt(0).toUpperCase() + preset.slice(1)}
                    </Button>
                  ))}
                </div>
                
                {/* Date Range Picker */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setQuickPreset('custom');
                      }}
                      max={endDate}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setQuickPreset('custom');
                      }}
                      min={startDate}
                      max={currentDate}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Types */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Report Type</h3>
              <div className="grid grid-cols-2 gap-3">
                {reportTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant="ghost"
                    onClick={() => setSelectedReportType(type.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all flex flex-col items-start h-auto",
                      selectedReportType === type.id
                        ? "border-primary bg-primary/5 shadow-sm hover:bg-primary/10"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className={`w-10 h-10 rounded-lg ${type.bgColor} flex items-center justify-center ${type.color} mb-3`}>
                      {type.icon}
                    </div>
                    <h4 className="font-medium text-foreground text-sm">{type.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 text-left whitespace-normal">{type.description}</p>
                  </Button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {downloadError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-center gap-3">
                <Icons.AlertCircle className="w-5 h-5 flex-shrink-0" />
                {downloadError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowPreview(true)}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  variant="glow"
                  className="flex-1 gap-2"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>

              {/* Additional Export Options */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={handleDownloadCSV}
                  disabled={isDownloadingCSV}
                  variant="soft"
                  size="sm"
                  className="gap-2"
                >
                  {isDownloadingCSV ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3 h-3" />
                  )}
                  CSV
                </Button>
                <Button
                  onClick={() => window.print()}
                  variant="soft"
                  size="sm"
                  className="gap-2"
                >
                  <Printer className="w-3 h-3" />
                  Print
                </Button>
                <Button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Baby Report',
                        text: `Baby report from ${startDate} to ${endDate}`,
                      });
                    }
                  }}
                  variant="soft"
                  size="sm"
                  className="gap-2"
                >
                  <Share2 className="w-3 h-3" />
                  Share
                </Button>
              </div>
            </div>

            {/* Email Report */}
            <Card variant="default" className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground text-sm">Email Report</h4>
                    <p className="text-xs text-muted-foreground">Send directly to doctor or nurse</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="doctor@example.com"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendEmail}
                    disabled={!emailAddress || isSendingEmail}
                    variant="soft"
                    size="icon"
                    className="h-10 w-10"
                  >
                    {isSendingEmail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scheduled Tab */}
        {activeTab === 'scheduled' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Schedules</h3>
              <Button onClick={() => setShowAddModal(true)} variant="glow" size="sm" className="gap-2">
                <Icons.Plus className="w-4 h-4" />
                New Schedule
              </Button>
            </div>

            {/* Error Message */}
            {scheduledError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-center gap-3">
                <Icons.AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{scheduledError}</span>
                <button onClick={() => setScheduledError(null)} className="p-1 hover:bg-destructive/10 rounded">
                  <Icons.Close className="w-4 h-4" />
                </button>
              </div>
            )}

            {loadingScheduled ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : scheduledReports.length === 0 ? (
              <Card variant="glass" className="overflow-hidden">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <CalendarClock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-2">No scheduled reports</h3>
                  <p className="text-muted-foreground mb-6 max-w-xs text-sm">
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
                {scheduledReports.map((report) => {
                  const isToggling = togglingIds.has(report.id);
                  const isDeleting = deletingIds.has(report.id);

                  return (
                    <Card 
                      key={report.id} 
                      variant="default" 
                      className={`overflow-hidden transition-opacity ${isDeleting ? 'opacity-50' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground truncate">{report.name}</h4>
                              {!report.isActive && (
                                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                  Paused
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{report.email}</p>
                            <p className="text-xs text-primary font-medium mt-1">{formatSchedule(report)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleScheduledReport(report.id, report.isActive)}
                              disabled={isToggling || isDeleting}
                              className={`relative w-10 h-6 rounded-full transition-all ${
                                report.isActive ? "bg-primary" : "bg-muted"
                              } ${isToggling ? 'opacity-50' : ''}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                report.isActive ? "translate-x-5" : "translate-x-1"
                              }`} />
                            </button>
                            <button
                              onClick={() => setEditingReport(report)}
                              disabled={isDeleting}
                              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                            >
                              <Icons.Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteScheduledReport(report.id)}
                              disabled={isDeleting || isToggling}
                              className="w-8 h-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 flex items-center justify-center text-muted-foreground hover:text-red-500"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground border-t border-muted/50 mt-3 pt-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last: {formatDate(report.lastSentAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Next: {formatDate(report.nextScheduledAt)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Past Reports</h3>
            
            {pastReports.length === 0 ? (
              <Card variant="glass" className="overflow-hidden">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                    <History className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-2">No reports yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-xs text-sm">
                    Generated reports will appear here
                  </p>
                  <Button onClick={() => setActiveTab('generate')} variant="soft" className="gap-2">
                    <Zap className="w-4 h-4" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pastReports.map((report) => {
                  const typeConfig = getReportTypeConfig(report.reportType);
                  return (
                    <Card key={report.id} variant="default" className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl ${typeConfig.bgColor} flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}>
                            {typeConfig.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground">{report.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(report.dateRange.start).toLocaleDateString()} - {new Date(report.dateRange.end).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{typeConfig.name}</span>
                              <span>•</span>
                              <span>{report.size}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && setShowPreview(false)}
          >
            <Card variant="aurora-static" className="w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-scale-in">
              <CardHeader className="pb-4 border-b border-primary/10">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl ${getReportTypeConfig(selectedReportType).bgColor} flex items-center justify-center ${getReportTypeConfig(selectedReportType).color}`}>
                      {getReportTypeConfig(selectedReportType).icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">Report Preview</CardTitle>
                      <CardDescription className="mt-1">{getReportTypeConfig(selectedReportType).name}</CardDescription>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Icons.Close className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Report Header Info */}
                <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Date Range</h4>
                      <p className="text-foreground font-medium">
                        {startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                      </p>
                      <p className="text-sm text-muted-foreground">to</p>
                      <p className="text-foreground font-medium">
                        {endDate ? new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Report Type</h4>
                      <p className="text-foreground font-medium">{getReportTypeConfig(selectedReportType).name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{getReportTypeConfig(selectedReportType).description}</p>
                    </div>
                  </div>
                </div>

                {/* Included Sections */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Included Sections
                  </h4>
                  <div className="space-y-2">
                    {selectedReportType === 'comprehensive' ? (
                      reportTypes.slice(0, 5).map(type => (
                        <div key={type.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className={`w-8 h-8 rounded-lg ${type.bgColor} flex items-center justify-center ${type.color}`}>
                            {type.icon}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-foreground">{type.name}</p>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                          </div>
                          <Icons.Check className="w-5 h-5 text-green-500" />
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className={`w-8 h-8 rounded-lg ${getReportTypeConfig(selectedReportType).bgColor} flex items-center justify-center ${getReportTypeConfig(selectedReportType).color}`}>
                          {getReportTypeConfig(selectedReportType).icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{getReportTypeConfig(selectedReportType).name}</p>
                          <p className="text-xs text-muted-foreground">{getReportTypeConfig(selectedReportType).description}</p>
                        </div>
                        <Icons.Check className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Report Features */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Report Features
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                      <Icons.Check className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Activity Summaries</p>
                        <p className="text-xs text-muted-foreground">Detailed counts & totals</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                      <Icons.Check className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Visual Charts</p>
                        <p className="text-xs text-muted-foreground">Graphs & trends</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                      <Icons.Check className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Key Statistics</p>
                        <p className="text-xs text-muted-foreground">Averages & patterns</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                      <Icons.Check className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Medical Format</p>
                        <p className="text-xs text-muted-foreground">Doctor-friendly</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-primary/10">
                  <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    variant="glow" 
                    onClick={() => { 
                      setShowPreview(false); 
                      handleDownloadPDF(); 
                    }} 
                    className="flex-1 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add/Edit Scheduled Report Modal */}
        {(showAddModal || editingReport) && (
          <ScheduledReportModal
            report={editingReport || undefined}
            onClose={() => {
              setShowAddModal(false);
              setEditingReport(null);
            }}
            onSave={editingReport 
              ? (data) => handleEditScheduledReport(editingReport.id, data)
              : handleAddScheduledReport
            }
          />
        )}
      </div>
    </MobileContainer>
  );
}

// Scheduled Report Modal Component
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
      setError(err instanceof Error ? err.message : "Failed to save");
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card variant="default" className="w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{isEditing ? "Edit Schedule" : "New Schedule"}</CardTitle>
                <CardDescription>{isEditing ? "Update settings" : "Set up automatic delivery"}</CardDescription>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80">
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekly Summary"
                className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@example.com"
                className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Frequency</label>
              <div className="grid grid-cols-3 gap-2">
                {frequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFrequency(option.value)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      frequency === option.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted bg-muted/50 hover:border-primary/50"
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
                <label className="block text-sm font-medium mb-2">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none"
                  disabled={isSubmitting}
                >
                  {daysOfWeek.map((day) => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>
            )}
            {frequency === "monthly" && (
              <div>
                <label className="block text-sm font-medium mb-2">Day of Month</label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none"
                  disabled={isSubmitting}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50">
              <label className="text-sm font-medium">Active</label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                disabled={isSubmitting}
                className={`relative w-10 h-6 rounded-full transition-all ${isActive ? "bg-primary" : "bg-muted"}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-1"}`} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="glow" className="flex-1" disabled={isSubmitting || !name.trim() || !email.trim()}>
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isEditing ? "Saving..." : "Creating..."}</>
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
