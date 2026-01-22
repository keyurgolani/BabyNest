"use client";

import { useState, useCallback } from "react";
import { MobileContainer } from "@/components/layout/mobile-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { api } from "@/lib/api-client";
import { useBaby } from "@/context/baby-context";
import { cn } from "@/lib/utils";
import { 
  PhotoAnalysisResponse, 
  ExtractedFeeding, 
  ExtractedSleep, 
  ExtractedDiaper,
  ExtractedMedication,
  ExtractedSymptom,
  ExtractedActivity,
} from "@babynest/types";

type ImportStep = "upload" | "review" | "complete";

// Edit modal for entries
interface EditModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave: () => void;
}

function EditModal({ title, children, onClose, onSave }: EditModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{title}</CardTitle>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80">
              <Icons.Close className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={onSave}>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PhotoImportPage() {
  const { loading: babyLoading } = useBaby();
  const [step, setStep] = useState<ImportStep>("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PhotoAnalysisResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Entry states
  const [feedings, setFeedings] = useState<ExtractedFeeding[]>([]);
  const [sleepEntries, setSleepEntries] = useState<ExtractedSleep[]>([]);
  const [diaperEntries, setDiaperEntries] = useState<ExtractedDiaper[]>([]);
  const [medications, setMedications] = useState<ExtractedMedication[]>([]);
  const [symptoms, setSymptoms] = useState<ExtractedSymptom[]>([]);
  const [activities, setActivities] = useState<ExtractedActivity[]>([]);
  
  // Edit states
  const [editingFeeding, setEditingFeeding] = useState<{ index: number; data: ExtractedFeeding } | null>(null);
  const [editingSleep, setEditingSleep] = useState<{ index: number; data: ExtractedSleep } | null>(null);
  const [editingDiaper, setEditingDiaper] = useState<{ index: number; data: ExtractedDiaper } | null>(null);
  const [editingMedication, setEditingMedication] = useState<{ index: number; data: ExtractedMedication } | null>(null);
  const [editingSymptom, setEditingSymptom] = useState<{ index: number; data: ExtractedSymptom } | null>(null);
  const [editingActivity, setEditingActivity] = useState<{ index: number; data: ExtractedActivity } | null>(null);
  
  const [importResult, setImportResult] = useState<{
    feedingsImported: number;
    sleepEntriesImported: number;
    diaperEntriesImported: number;
    medicationsImported: number;
    symptomsImported: number;
    activitiesImported: number;
    errors?: string[];
  } | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await api.photoImport.analyze(selectedFile);
      setAnalysisResult(result);
      if (result.success) {
        setFeedings(result.feedings);
        setSleepEntries(result.sleepEntries);
        setDiaperEntries(result.diaperEntries);
        setMedications(result.medications || []);
        setSymptoms(result.symptoms || []);
        setActivities(result.activities || []);
        setStep("review");
      } else {
        setError(result.error || "Failed to analyze photo");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze photo");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    try {
      const result = await api.photoImport.confirm({ 
        feedings, 
        sleepEntries, 
        diaperEntries,
        medications,
        symptoms,
        activities,
      });
      setImportResult(result);
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import data");
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setFeedings([]);
    setSleepEntries([]);
    setDiaperEntries([]);
    setMedications([]);
    setSymptoms([]);
    setActivities([]);
    setImportResult(null);
    setError(null);
  };

  const removeFeeding = (index: number) => setFeedings(prev => prev.filter((_, i) => i !== index));
  const removeSleep = (index: number) => setSleepEntries(prev => prev.filter((_, i) => i !== index));
  const removeDiaper = (index: number) => setDiaperEntries(prev => prev.filter((_, i) => i !== index));
  const removeMedication = (index: number) => setMedications(prev => prev.filter((_, i) => i !== index));
  const removeSymptom = (index: number) => setSymptoms(prev => prev.filter((_, i) => i !== index));
  const removeActivity = (index: number) => setActivities(prev => prev.filter((_, i) => i !== index));

  const formatTime = (isoString: string) => {
    try { return new Date(isoString).toLocaleString(); } catch { return isoString; }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "text-muted-foreground";
    if (confidence >= 0.8) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.5) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const totalEntries = feedings.length + sleepEntries.length + diaperEntries.length + medications.length + symptoms.length + activities.length;

  if (babyLoading) {
    return (
      <MobileContainer>
        <div className="flex h-full items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="p-6 space-y-6 animate-slide-up pb-32">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
            <Icons.Camera className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-heading font-bold text-foreground">Import from Photo</h1>
            <p className="text-muted-foreground text-sm">Upload handwritten logs to import</p>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Icons.AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "upload" && (
          <Card className="border-0 bg-card/50 card-elevated">
            <CardHeader>
              <CardTitle className="text-lg">Upload Photo</CardTitle>
              <CardDescription>Take a photo of your handwritten baby log or upload an existing image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                  "hover:border-primary/50 hover:bg-primary/5",
                  selectedFile ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                )}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input id="file-input" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={handleFileSelect} className="hidden" />
                {previewUrl ? (
                  <div className="space-y-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                    <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreviewUrl(null); }}>
                      <Icons.Close className="w-4 h-4 mr-2" />Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                      <Icons.Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Drop your photo here</p>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Supports JPEG, PNG, WebP, HEIC (max 20MB)</p>
                  </div>
                )}
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Supported entry types:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Icons.Feed className="w-3 h-3" /> Feeding (BF, bottle, pumping)</div>
                  <div className="flex items-center gap-2"><Icons.Sleep className="w-3 h-3" /> Sleep (naps, night)</div>
                  <div className="flex items-center gap-2"><Icons.Diaper className="w-3 h-3" /> Diaper changes</div>
                  <div className="flex items-center gap-2"><Icons.Medication className="w-3 h-3" /> Medications</div>
                  <div className="flex items-center gap-2"><Icons.Temperature className="w-3 h-3" /> Temperature/symptoms</div>
                  <div className="flex items-center gap-2"><Icons.Activity className="w-3 h-3" /> Activities (tummy time)</div>
                </div>
              </div>
              <Button className="w-full" disabled={!selectedFile || isAnalyzing} onClick={handleAnalyze}>
                {isAnalyzing ? (<><Icons.Spinner className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>) : (<><Icons.Sparkles className="w-4 h-4 mr-2" />Analyze Photo</>)}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "review" && analysisResult && (
          <>
            {analysisResult.rawText && (
              <Card className="border-0 bg-card/50 card-elevated">
                <CardHeader className="pb-2"><CardTitle className="text-base">Extracted Text</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">{analysisResult.rawText}</p></CardContent>
              </Card>
            )}
            {analysisResult.warnings && analysisResult.warnings.length > 0 && (
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icons.AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Notes</p>
                      {analysisResult.warnings.map((warning, i) => (<p key={i} className="text-xs text-amber-600 dark:text-amber-400">{warning}</p>))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feeding Entries */}
            {feedings.length > 0 && (
              <Card className="border-0 bg-card/50 card-elevated">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
                      <Icons.Feed className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <CardTitle className="text-base">Feeding Entries ({feedings.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {feedings.map((feeding, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-1 flex-1" onClick={() => setEditingFeeding({ index, data: { ...feeding } })}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm capitalize">{feeding.type}</span>
                          <span className={cn("text-xs", getConfidenceColor(feeding.confidence))}>{Math.round((feeding.confidence || 0) * 100)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatTime(feeding.timestamp)}</p>
                        {feeding.type === "breastfeeding" && (<p className="text-xs text-muted-foreground">L: {feeding.leftDuration ? `${Math.round(feeding.leftDuration / 60)}min` : "-"} | R: {feeding.rightDuration ? `${Math.round(feeding.rightDuration / 60)}min` : "-"}</p>)}
                        {(feeding.type === "bottle" || feeding.type === "pumping") && feeding.amount && (<p className="text-xs text-muted-foreground">{feeding.amount}ml {feeding.bottleType && `(${feeding.bottleType})`}</p>)}
                        {feeding.notes && (<p className="text-xs text-muted-foreground italic">{feeding.notes}</p>)}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingFeeding({ index, data: { ...feeding } })}><Icons.Edit className="w-4 h-4 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => removeFeeding(index)}><Icons.Trash className="w-4 h-4 text-muted-foreground" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Sleep Entries */}
            {sleepEntries.length > 0 && (
              <Card className="border-0 bg-card/50 card-elevated">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
                      <Icons.Sleep className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle className="text-base">Sleep Entries ({sleepEntries.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sleepEntries.map((sleep, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm capitalize">{sleep.sleepType}</span>
                          <span className={cn("text-xs", getConfidenceColor(sleep.confidence))}>{Math.round((sleep.confidence || 0) * 100)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatTime(sleep.startTime)}{sleep.endTime && ` → ${formatTime(sleep.endTime)}`}</p>
                        {sleep.quality && (<p className="text-xs text-muted-foreground">Quality: {sleep.quality}</p>)}
                        {sleep.notes && (<p className="text-xs text-muted-foreground italic">{sleep.notes}</p>)}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingSleep({ index, data: { ...sleep } })}><Icons.Edit className="w-4 h-4 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => removeSleep(index)}><Icons.Trash className="w-4 h-4 text-muted-foreground" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Diaper Entries */}
            {diaperEntries.length > 0 && (
              <Card className="border-0 bg-card/50 card-elevated">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                      <Icons.Diaper className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <CardTitle className="text-base">Diaper Entries ({diaperEntries.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {diaperEntries.map((diaper, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm capitalize">{diaper.type}</span>
                          <span className={cn("text-xs", getConfidenceColor(diaper.confidence))}>{Math.round((diaper.confidence || 0) * 100)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatTime(diaper.timestamp)}</p>
                        {(diaper.color || diaper.consistency) && (<p className="text-xs text-muted-foreground">{[diaper.color, diaper.consistency].filter(Boolean).join(", ")}</p>)}
                        {diaper.hasRash && (<p className="text-xs text-red-600 dark:text-red-400">Has rash</p>)}
                        {diaper.notes && (<p className="text-xs text-muted-foreground italic">{diaper.notes}</p>)}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingDiaper({ index, data: { ...diaper } })}><Icons.Edit className="w-4 h-4 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => removeDiaper(index)}><Icons.Trash className="w-4 h-4 text-muted-foreground" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Medication Entries */}
            {medications.length > 0 && (
              <Card className="border-0 bg-card/50 card-elevated">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
                      <Icons.Medication className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-base">Medication Entries ({medications.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {medications.map((med, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{med.name}</span>
                          <span className={cn("text-xs", getConfidenceColor(med.confidence))}>{Math.round((med.confidence || 0) * 100)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatTime(med.timestamp)}</p>
                        {med.dosage && (<p className="text-xs text-muted-foreground">{med.dosage} {med.unit || ''}</p>)}
                        {med.notes && (<p className="text-xs text-muted-foreground italic">{med.notes}</p>)}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingMedication({ index, data: { ...med } })}><Icons.Edit className="w-4 h-4 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => removeMedication(index)}><Icons.Trash className="w-4 h-4 text-muted-foreground" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Symptom Entries */}
            {symptoms.length > 0 && (
              <Card className="border-0 bg-card/50 card-elevated">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                      <Icons.Symptom className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-base">Symptom Entries ({symptoms.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {symptoms.map((symptom, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm capitalize">{symptom.symptomType.replace('_', ' ')}</span>
                          <span className={cn("text-xs", getConfidenceColor(symptom.confidence))}>{Math.round((symptom.confidence || 0) * 100)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatTime(symptom.timestamp)}</p>
                        {symptom.temperature && (<p className="text-xs text-muted-foreground">Temp: {symptom.temperature}°</p>)}
                        {symptom.severity && (<p className="text-xs text-muted-foreground">Severity: {symptom.severity}</p>)}
                        {symptom.notes && (<p className="text-xs text-muted-foreground italic">{symptom.notes}</p>)}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingSymptom({ index, data: { ...symptom } })}><Icons.Edit className="w-4 h-4 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => removeSymptom(index)}><Icons.Trash className="w-4 h-4 text-muted-foreground" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Activity Entries */}
            {activities.length > 0 && (
              <Card className="border-0 bg-card/50 card-elevated">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                      <Icons.Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-base">Activity Entries ({activities.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activities.map((activity, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm capitalize">{activity.activityType.replace('_', ' ')}</span>
                          <span className={cn("text-xs", getConfidenceColor(activity.confidence))}>{Math.round((activity.confidence || 0) * 100)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatTime(activity.timestamp)}</p>
                        {activity.duration && (<p className="text-xs text-muted-foreground">{Math.round(activity.duration / 60)} min</p>)}
                        {activity.notes && (<p className="text-xs text-muted-foreground italic">{activity.notes}</p>)}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingActivity({ index, data: { ...activity } })}><Icons.Edit className="w-4 h-4 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => removeActivity(index)}><Icons.Trash className="w-4 h-4 text-muted-foreground" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {totalEntries === 0 && (
              <Card className="border-0 bg-card/50 card-elevated">
                <CardContent className="p-8 text-center">
                  <Icons.AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No entries could be extracted from this photo.</p>
                  <p className="text-sm text-muted-foreground mt-2">Try uploading a clearer image with visible handwritten logs.</p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleReset}><Icons.Close className="w-4 h-4 mr-2" />Cancel</Button>
              <Button className="flex-1" disabled={isImporting || totalEntries === 0} onClick={handleImport}>
                {isImporting ? (<><Icons.Spinner className="w-4 h-4 mr-2 animate-spin" />Importing...</>) : (<><Icons.Check className="w-4 h-4 mr-2" />Import {totalEntries} Entries</>)}
              </Button>
            </div>
          </>
        )}

        {step === "complete" && importResult && (
          <Card className="border-0 bg-card/50 card-elevated">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                <Icons.Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Import Complete!</h2>
                <p className="text-muted-foreground">Your entries have been added to the tracking log.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {importResult.feedingsImported > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{importResult.feedingsImported}</p>
                    <p className="text-xs text-muted-foreground">Feedings</p>
                  </div>
                )}
                {importResult.sleepEntriesImported > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{importResult.sleepEntriesImported}</p>
                    <p className="text-xs text-muted-foreground">Sleep</p>
                  </div>
                )}
                {importResult.diaperEntriesImported > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{importResult.diaperEntriesImported}</p>
                    <p className="text-xs text-muted-foreground">Diapers</p>
                  </div>
                )}
                {importResult.medicationsImported > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{importResult.medicationsImported}</p>
                    <p className="text-xs text-muted-foreground">Meds</p>
                  </div>
                )}
                {importResult.symptomsImported > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{importResult.symptomsImported}</p>
                    <p className="text-xs text-muted-foreground">Symptoms</p>
                  </div>
                )}
                {importResult.activitiesImported > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{importResult.activitiesImported}</p>
                    <p className="text-xs text-muted-foreground">Activities</p>
                  </div>
                )}
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="text-left bg-red-50 dark:bg-red-950/30 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Some entries could not be imported:</p>
                  {importResult.errors.map((err, i) => (<p key={i} className="text-xs text-red-600 dark:text-red-400">{err}</p>))}
                </div>
              )}
              <Button className="w-full" onClick={handleReset}><Icons.Plus className="w-4 h-4 mr-2" />Import Another Photo</Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Modals */}
        {editingFeeding && (
          <EditModal
            title="Edit Feeding Entry"
            onClose={() => setEditingFeeding(null)}
            onSave={() => {
              setFeedings(prev => prev.map((f, i) => i === editingFeeding.index ? editingFeeding.data : f));
              setEditingFeeding(null);
            }}
          >
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingFeeding.data.type}
                  onChange={(e) => setEditingFeeding({ ...editingFeeding, data: { ...editingFeeding.data, type: e.target.value as ExtractedFeeding['type'] } })}
                >
                  <option value="breastfeeding">Breastfeeding</option>
                  <option value="bottle">Bottle</option>
                  <option value="pumping">Pumping</option>
                  <option value="solid">Solid Food</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Time</label>
                <input
                  type="datetime-local"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingFeeding.data.timestamp.slice(0, 16)}
                  onChange={(e) => setEditingFeeding({ ...editingFeeding, data: { ...editingFeeding.data, timestamp: new Date(e.target.value).toISOString() } })}
                />
              </div>
              {editingFeeding.data.type === 'breastfeeding' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Left (min)</label>
                    <input
                      type="number"
                      className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                      value={editingFeeding.data.leftDuration ? Math.round(editingFeeding.data.leftDuration / 60) : ''}
                      onChange={(e) => setEditingFeeding({ ...editingFeeding, data: { ...editingFeeding.data, leftDuration: e.target.value ? parseInt(e.target.value) * 60 : undefined } })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Right (min)</label>
                    <input
                      type="number"
                      className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                      value={editingFeeding.data.rightDuration ? Math.round(editingFeeding.data.rightDuration / 60) : ''}
                      onChange={(e) => setEditingFeeding({ ...editingFeeding, data: { ...editingFeeding.data, rightDuration: e.target.value ? parseInt(e.target.value) * 60 : undefined } })}
                    />
                  </div>
                </div>
              )}
              {(editingFeeding.data.type === 'bottle' || editingFeeding.data.type === 'pumping') && (
                <div>
                  <label className="text-sm font-medium">Amount (ml)</label>
                  <input
                    type="number"
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                    value={editingFeeding.data.amount || ''}
                    onChange={(e) => setEditingFeeding({ ...editingFeeding, data: { ...editingFeeding.data, amount: e.target.value ? parseInt(e.target.value) : undefined } })}
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Notes</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingFeeding.data.notes || ''}
                  onChange={(e) => setEditingFeeding({ ...editingFeeding, data: { ...editingFeeding.data, notes: e.target.value || undefined } })}
                />
              </div>
            </div>
          </EditModal>
        )}

        {editingSleep && (
          <EditModal
            title="Edit Sleep Entry"
            onClose={() => setEditingSleep(null)}
            onSave={() => {
              setSleepEntries(prev => prev.map((s, i) => i === editingSleep.index ? editingSleep.data : s));
              setEditingSleep(null);
            }}
          >
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingSleep.data.sleepType}
                  onChange={(e) => setEditingSleep({ ...editingSleep, data: { ...editingSleep.data, sleepType: e.target.value as 'nap' | 'night' } })}
                >
                  <option value="nap">Nap</option>
                  <option value="night">Night Sleep</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Start Time</label>
                <input
                  type="datetime-local"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingSleep.data.startTime.slice(0, 16)}
                  onChange={(e) => setEditingSleep({ ...editingSleep, data: { ...editingSleep.data, startTime: new Date(e.target.value).toISOString() } })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Time</label>
                <input
                  type="datetime-local"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingSleep.data.endTime?.slice(0, 16) || ''}
                  onChange={(e) => setEditingSleep({ ...editingSleep, data: { ...editingSleep.data, endTime: e.target.value ? new Date(e.target.value).toISOString() : undefined } })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingSleep.data.notes || ''}
                  onChange={(e) => setEditingSleep({ ...editingSleep, data: { ...editingSleep.data, notes: e.target.value || undefined } })}
                />
              </div>
            </div>
          </EditModal>
        )}

        {editingDiaper && (
          <EditModal
            title="Edit Diaper Entry"
            onClose={() => setEditingDiaper(null)}
            onSave={() => {
              setDiaperEntries(prev => prev.map((d, i) => i === editingDiaper.index ? editingDiaper.data : d));
              setEditingDiaper(null);
            }}
          >
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingDiaper.data.type}
                  onChange={(e) => setEditingDiaper({ ...editingDiaper, data: { ...editingDiaper.data, type: e.target.value as ExtractedDiaper['type'] } })}
                >
                  <option value="wet">Wet</option>
                  <option value="dirty">Dirty</option>
                  <option value="mixed">Mixed</option>
                  <option value="dry">Dry</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Time</label>
                <input
                  type="datetime-local"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingDiaper.data.timestamp.slice(0, 16)}
                  onChange={(e) => setEditingDiaper({ ...editingDiaper, data: { ...editingDiaper.data, timestamp: new Date(e.target.value).toISOString() } })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingDiaper.data.notes || ''}
                  onChange={(e) => setEditingDiaper({ ...editingDiaper, data: { ...editingDiaper.data, notes: e.target.value || undefined } })}
                />
              </div>
            </div>
          </EditModal>
        )}

        {editingMedication && (
          <EditModal
            title="Edit Medication Entry"
            onClose={() => setEditingMedication(null)}
            onSave={() => {
              setMedications(prev => prev.map((m, i) => i === editingMedication.index ? editingMedication.data : m));
              setEditingMedication(null);
            }}
          >
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Medication Name</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingMedication.data.name}
                  onChange={(e) => setEditingMedication({ ...editingMedication, data: { ...editingMedication.data, name: e.target.value } })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time</label>
                <input
                  type="datetime-local"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingMedication.data.timestamp.slice(0, 16)}
                  onChange={(e) => setEditingMedication({ ...editingMedication, data: { ...editingMedication.data, timestamp: new Date(e.target.value).toISOString() } })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Dosage</label>
                  <input
                    type="number"
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                    value={editingMedication.data.dosage || ''}
                    onChange={(e) => setEditingMedication({ ...editingMedication, data: { ...editingMedication.data, dosage: e.target.value ? parseFloat(e.target.value) : undefined } })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unit</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                    placeholder="ml, mg, drops"
                    value={editingMedication.data.unit || ''}
                    onChange={(e) => setEditingMedication({ ...editingMedication, data: { ...editingMedication.data, unit: e.target.value || undefined } })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingMedication.data.notes || ''}
                  onChange={(e) => setEditingMedication({ ...editingMedication, data: { ...editingMedication.data, notes: e.target.value || undefined } })}
                />
              </div>
            </div>
          </EditModal>
        )}

        {editingSymptom && (
          <EditModal
            title="Edit Symptom Entry"
            onClose={() => setEditingSymptom(null)}
            onSave={() => {
              setSymptoms(prev => prev.map((s, i) => i === editingSymptom.index ? editingSymptom.data : s));
              setEditingSymptom(null);
            }}
          >
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Symptom Type</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingSymptom.data.symptomType}
                  onChange={(e) => setEditingSymptom({ ...editingSymptom, data: { ...editingSymptom.data, symptomType: e.target.value } })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time</label>
                <input
                  type="datetime-local"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingSymptom.data.timestamp.slice(0, 16)}
                  onChange={(e) => setEditingSymptom({ ...editingSymptom, data: { ...editingSymptom.data, timestamp: new Date(e.target.value).toISOString() } })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Temperature</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingSymptom.data.temperature || ''}
                  onChange={(e) => setEditingSymptom({ ...editingSymptom, data: { ...editingSymptom.data, temperature: e.target.value ? parseFloat(e.target.value) : undefined } })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingSymptom.data.severity || ''}
                  onChange={(e) => setEditingSymptom({ ...editingSymptom, data: { ...editingSymptom.data, severity: e.target.value as 'mild' | 'moderate' | 'severe' | undefined || undefined } })}
                >
                  <option value="">Not specified</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingSymptom.data.notes || ''}
                  onChange={(e) => setEditingSymptom({ ...editingSymptom, data: { ...editingSymptom.data, notes: e.target.value || undefined } })}
                />
              </div>
            </div>
          </EditModal>
        )}

        {editingActivity && (
          <EditModal
            title="Edit Activity Entry"
            onClose={() => setEditingActivity(null)}
            onSave={() => {
              setActivities(prev => prev.map((a, i) => i === editingActivity.index ? editingActivity.data : a));
              setEditingActivity(null);
            }}
          >
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Activity Type</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingActivity.data.activityType}
                  onChange={(e) => setEditingActivity({ ...editingActivity, data: { ...editingActivity.data, activityType: e.target.value } })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time</label>
                <input
                  type="datetime-local"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingActivity.data.timestamp.slice(0, 16)}
                  onChange={(e) => setEditingActivity({ ...editingActivity, data: { ...editingActivity.data, timestamp: new Date(e.target.value).toISOString() } })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Duration (minutes)</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingActivity.data.duration ? Math.round(editingActivity.data.duration / 60) : ''}
                  onChange={(e) => setEditingActivity({ ...editingActivity, data: { ...editingActivity.data, duration: e.target.value ? parseInt(e.target.value) * 60 : undefined } })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                  value={editingActivity.data.notes || ''}
                  onChange={(e) => setEditingActivity({ ...editingActivity, data: { ...editingActivity.data, notes: e.target.value || undefined } })}
                />
              </div>
            </div>
          </EditModal>
        )}
      </div>
    </MobileContainer>
  );
}
