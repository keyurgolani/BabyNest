"use client";

import { useState } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { Icons } from "@/components/icons";
import { api } from "@/lib/api-client";

/**
 * DataManagementModal Component
 *
 * A modal for managing data export, import, and deletion with glassmorphism styling.
 * Uses GlassModal wrapper, GlassButton danger variant for destructive actions,
 * and GlassButton default variant for non-destructive actions.
 *
 * Features:
 * - Export data in JSON or CSV format
 * - Import data from JSON backup files
 * - Clear all data with confirmation (danger zone)
 *
 * @requirements 18.5
 */

interface DataManagementModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
}

export function DataManagementModal({ isOpen, onClose }: DataManagementModalProps) {
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

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert('Import feature coming soon! Export your data first to create a backup.');
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Data Management"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Icon and Description */}
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Icons.Report className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            Export, import, or manage your tracking data
          </p>
        </div>

        {/* Export Data Section */}
        <div className="p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
          <h3 className="font-medium text-foreground mb-2">Export Data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Download all your baby tracking data for backup or transfer
          </p>
          
          {/* Format Selection */}
          <div className="flex gap-2 mb-4">
            {(['json', 'csv'] as const).map((format) => (
              <GlassButton
                key={format}
                variant={exportFormat === format ? 'primary' : 'default'}
                size="sm"
                onClick={() => setExportFormat(format)}
                className="px-4"
              >
                {format.toUpperCase()}
              </GlassButton>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground mb-3">
            {exportFormat === 'json' 
              ? 'JSON format can be re-imported to restore your data'
              : 'CSV format is compatible with spreadsheet applications'}
          </p>
          
          <GlassButton 
            onClick={handleExport}
            variant="default"
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
          </GlassButton>
        </div>

        {/* Import Data Section */}
        <div className="p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
          <h3 className="font-medium text-foreground mb-2">Import Data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Import data from a JSON backup file
          </p>
          
          <label className="block">
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileImport}
            />
            <GlassButton variant="default" className="w-full" asChild>
              <span>
                <Icons.Plus className="w-4 h-4 mr-2" />
                Select JSON File to Import
              </span>
            </GlassButton>
          </label>
          <p className="text-xs text-muted-foreground mt-2">
            Only JSON files exported from this app can be imported
          </p>
        </div>

        {/* Danger Zone - Clear Data Section */}
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <h3 className="font-medium text-destructive mb-2">Danger Zone</h3>
          <p className="text-sm text-destructive/80 mb-4">
            Permanently delete all your data. This action cannot be undone.
          </p>
          
          {!showClearConfirm ? (
            <GlassButton 
              variant="danger"
              className="w-full"
              onClick={() => setShowClearConfirm(true)}
            >
              <Icons.Trash className="w-4 h-4 mr-2" />
              Clear All Data
            </GlassButton>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-destructive">
                Type <strong>DELETE ALL DATA</strong> to confirm:
              </p>
              <GlassInput
                type="text"
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                placeholder="DELETE ALL DATA"
                disabled={isClearing}
                error={clearConfirmText.length > 0 && clearConfirmText !== 'DELETE ALL DATA'}
                className="bg-white/5"
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
                  disabled={isClearing}
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
                  {isClearing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Confirm Delete'
                  )}
                </GlassButton>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <GlassButton 
          variant="primary" 
          onClick={onClose} 
          className="w-full"
        >
          <Icons.Check className="w-4 h-4 mr-2" />
          Done
        </GlassButton>
      </div>
    </GlassModal>
  );
}
