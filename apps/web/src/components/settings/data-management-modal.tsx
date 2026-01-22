"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { api } from "@/lib/api-client";

interface DataManagementModalProps {
  onClose: () => void;
}

export function DataManagementModal({ onClose }: DataManagementModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let blob: Blob;
      let filename: string;
      const dateStr = new Date().toISOString().split('T')[0];
      
      if (exportFormat === 'json') {
        blob = await api.export.downloadAllDataJSON();
        filename = `babynest-export-${dateStr}.json`;
      } else {
        blob = await api.export.downloadAllDataCSV();
        filename = `babynest-export-${dateStr}.csv`;
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = async () => {
    if (clearConfirmText !== 'DELETE ALL DATA') return;
    
    setIsClearing(true);
    try {
      // In a real app, this would call an API to clear all data
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('This feature is not yet implemented for safety reasons.');
      setShowClearConfirm(false);
      setClearConfirmText('');
    } catch (error) {
      console.error('Failed to clear data:', error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card variant="default" className="w-full max-w-md animate-scale-in shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                <Icons.Report className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Data Management</CardTitle>
                <CardDescription>Export or import your tracking data</CardDescription>
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

        <CardContent className="pt-0 space-y-6">
          {/* Export Data */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <h3 className="font-medium text-foreground mb-2">Export Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Download all your baby tracking data for backup or transfer
            </p>
            
            <div className="flex gap-2 mb-4">
              {(['json', 'csv'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => setExportFormat(format)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    exportFormat === format
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted text-foreground'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">
              {exportFormat === 'json' 
                ? 'JSON format can be re-imported to restore your data'
                : 'CSV format is compatible with spreadsheet applications'}
            </p>
            
            <Button 
              onClick={handleExport}
              variant="outline"
              className="w-full"
              disabled={isExporting}
            >
              {isExporting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Exporting...
                </div>
              ) : (
                <>
                  <Icons.Report className="w-4 h-4 mr-2" />
                  Export as {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>

          {/* Import Data */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <h3 className="font-medium text-foreground mb-2">Import Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Import data from a JSON backup file
            </p>
            
            <label className="block">
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    alert('Import feature coming soon! Export your data first to create a backup.');
                  }
                }}
              />
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <Icons.Plus className="w-4 h-4 mr-2" />
                  Select JSON File to Import
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              Only JSON files exported from this app can be imported
            </p>
          </div>

          {/* Clear Data */}
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
            <h3 className="font-medium text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-600 dark:text-red-400/80 mb-4">
              Permanently delete all your data. This action cannot be undone.
            </p>
            
            {!showClearConfirm ? (
              <Button 
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                onClick={() => setShowClearConfirm(true)}
              >
                <Icons.Trash className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-red-600 dark:text-red-400">
                  Type <strong>DELETE ALL DATA</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={clearConfirmText}
                  onChange={(e) => setClearConfirmText(e.target.value)}
                  placeholder="DELETE ALL DATA"
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-red-950/30 border border-red-300 dark:border-red-800 text-foreground text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setShowClearConfirm(false);
                      setClearConfirmText('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    disabled={clearConfirmText !== 'DELETE ALL DATA' || isClearing}
                    onClick={handleClearData}
                  >
                    {isClearing ? 'Deleting...' : 'Confirm Delete'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
