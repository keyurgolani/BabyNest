"use client";

import { useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassCard } from "@/components/ui/glass-card";
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
      <GlassCard size="sm" className="p-3">
        <h3 className="font-medium text-foreground text-sm mb-2">Export Data</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Download all your baby tracking data for backup
        </p>
        
        <div className="flex gap-2 mb-3">
          {(['json', 'csv'] as const).map((format) => (
            <button
              key={format}
              onClick={() => setExportFormat(format)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all backdrop-blur-sm border ${
                exportFormat === format
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]'
                  : 'bg-white/5 hover:bg-white/10 text-foreground border-white/10'
              }`}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>
        
        <GlassButton 
          onClick={handleExport}
          variant="default"
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
        </GlassButton>
      </GlassCard>

      {/* Import Data */}
      <GlassCard size="sm" className="p-3">
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
          <GlassButton variant="default" size="sm" className="w-full" asChild>
            <span>
              <Icons.Plus className="w-3 h-3 mr-2" />
              Select JSON File
            </span>
          </GlassButton>
        </label>
      </GlassCard>

      {/* Import from Photo */}
      <GlassCard size="sm" className="p-3">
        <h3 className="font-medium text-foreground text-sm mb-2">Import from Photo</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Use AI to extract tracking data from photos of handwritten logs
        </p>
        
        <Link href="/import">
          <GlassButton variant="default" size="sm" className="w-full">
            <Icons.PhotoImport className="w-3 h-3 mr-2" />
            Open Photo Import
          </GlassButton>
        </Link>
      </GlassCard>

      {/* Clear Data */}
      <div className="p-3 rounded-xl bg-red-500/10 backdrop-blur-sm border border-red-500/20">
        <h3 className="font-medium text-red-700 dark:text-red-400 text-sm mb-2">Danger Zone</h3>
        <p className="text-xs text-red-600 dark:text-red-400/80 mb-3">
          Permanently delete all your data. This cannot be undone.
        </p>
        
        {!showClearConfirm ? (
          <GlassButton 
            variant="danger"
            size="sm"
            className="w-full"
            onClick={() => setShowClearConfirm(true)}
          >
            <Icons.Trash className="w-3 h-3 mr-2" />
            Clear All Data
          </GlassButton>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-600 dark:text-red-400">
              Type <strong>DELETE ALL DATA</strong> to confirm:
            </p>
            <GlassInput
              type="text"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              placeholder="DELETE ALL DATA"
              className="text-xs"
            />
            <div className="flex gap-2">
              <GlassButton 
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearConfirmText('');
                }}
              >
                Cancel
              </GlassButton>
              <GlassButton 
                variant="danger"
                size="sm"
                className="flex-1"
                disabled={clearConfirmText !== 'DELETE ALL DATA' || isClearing}
                onClick={handleClearData}
              >
                {isClearing ? 'Deleting...' : 'Confirm'}
              </GlassButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
