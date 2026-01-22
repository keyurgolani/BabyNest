"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { api } from "@/lib/api-client";
import Link from "next/link";

export function DataManagementContent() {
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
    <div className="space-y-4 pt-2">
      {/* Export Data */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
        <h3 className="font-medium text-foreground text-sm mb-2">Export Data</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Download all your baby tracking data for backup
        </p>
        
        <div className="flex gap-2 mb-3">
          {(['json', 'csv'] as const).map((format) => (
            <button
              key={format}
              onClick={() => setExportFormat(format)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                exportFormat === format
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted text-foreground'
              }`}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>
        
        <Button 
          onClick={handleExport}
          variant="outline"
          size="sm"
          className="w-full"
          disabled={isExporting}
        >
          {isExporting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              Exporting...
            </div>
          ) : (
            <>
              <Icons.Report className="w-3 h-3 mr-2" />
              Export as {exportFormat.toUpperCase()}
            </>
          )}
        </Button>
      </div>

      {/* Import Data */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
        <h3 className="font-medium text-foreground text-sm mb-2">Import Data</h3>
        <p className="text-xs text-muted-foreground mb-3">
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
                alert('Import feature coming soon!');
              }
            }}
          />
          <Button variant="outline" size="sm" className="w-full" asChild>
            <span>
              <Icons.Plus className="w-3 h-3 mr-2" />
              Select JSON File
            </span>
          </Button>
        </label>
      </div>

      {/* Import from Photo */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
        <h3 className="font-medium text-foreground text-sm mb-2">Import from Photo</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Use AI to extract tracking data from photos of handwritten logs
        </p>
        
        <Link href="/import">
          <Button variant="outline" size="sm" className="w-full">
            <Icons.PhotoImport className="w-3 h-3 mr-2" />
            Open Photo Import
          </Button>
        </Link>
      </div>

      {/* Clear Data */}
      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
        <h3 className="font-medium text-red-700 dark:text-red-400 text-sm mb-2">Danger Zone</h3>
        <p className="text-xs text-red-600 dark:text-red-400/80 mb-3">
          Permanently delete all your data. This cannot be undone.
        </p>
        
        {!showClearConfirm ? (
          <Button 
            variant="outline"
            size="sm"
            className="w-full border-red-300 text-red-600 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
            onClick={() => setShowClearConfirm(true)}
          >
            <Icons.Trash className="w-3 h-3 mr-2" />
            Clear All Data
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-600 dark:text-red-400">
              Type <strong>DELETE ALL DATA</strong> to confirm:
            </p>
            <input
              type="text"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              placeholder="DELETE ALL DATA"
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-red-950/30 border border-red-300 dark:border-red-800 text-foreground text-xs"
            />
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7"
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
                className="flex-1 text-xs h-7"
                disabled={clearConfirmText !== 'DELETE ALL DATA' || isClearing}
                onClick={handleClearData}
              >
                {isClearing ? 'Deleting...' : 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
