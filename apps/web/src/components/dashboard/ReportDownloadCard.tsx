"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, Calendar } from "lucide-react";
import { api } from "@/lib/api-client";
import Link from "next/link";

export function ReportDownloadCard() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Get last 7 days report
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const blob = await api.export.downloadPDFReport({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `baby-report-${endDate.toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download report:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">Weekly Report</h3>
            <p className="text-xs text-muted-foreground">
              Download the latest 7-day summary
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-200/50 dark:border-blue-800/30 flex items-center justify-between">
          <Link
            href="/report"
            className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
          >
            <Calendar className="w-3 h-3" />
            Custom date range
          </Link>
          <Link
            href="/scheduled-reports"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Schedule reports →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
