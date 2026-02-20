import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Download, 
  FileJson, 
  FileText, 
  Upload, 
  Share2,
  Check,
  Copy,
  FileImage
} from 'lucide-react';
import { exportToJSON, downloadJSON, exportToPDF, validateImportData, ExportData } from '@/lib/exportUtils';
import { ReasoningMap } from '@/types/case';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  caseId: string;
  caseTitle: string;
  reasoningMap: ReasoningMap;
  canvasRef?: React.RefObject<HTMLDivElement>;
}

export function ExportMenu({ caseId, caseTitle, reasoningMap, canvasRef }: ExportDialogProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    try {
      const json = exportToJSON(caseId, caseTitle, reasoningMap);
      const filename = `reasoning-map-${caseId}-${new Date().toISOString().split('T')[0]}.json`;
      downloadJSON(json, filename);
      toast.success('Map exported successfully!');
    } catch (error) {
      toast.error('Failed to export map');
      console.error(error);
    }
  };

  const handleExportPDF = async () => {
    if (!canvasRef?.current) {
      toast.error('Canvas not available');
      return;
    }

    try {
      const filename = `reasoning-map-${caseId}-${new Date().toISOString().split('T')[0]}.pdf`;
      await exportToPDF(canvasRef.current, filename, caseTitle);
      toast.success('PDF exported successfully!');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    }
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importData);
      
      if (!validateImportData(parsed)) {
        toast.error('Invalid import data format');
        return;
      }

      // Dispatch custom event for parent to handle import
      const event = new CustomEvent('importReasoningMap', { 
        detail: parsed.reasoningMap 
      });
      window.dispatchEvent(event);
      
      toast.success('Map imported successfully!');
      setShowImportDialog(false);
      setImportData('');
    } catch (error) {
      toast.error('Failed to parse import data');
      console.error(error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setImportData(content);
      } catch (error) {
        toast.error('Failed to read file');
      }
    };
    reader.readAsText(file);
  };

  const handleShare = () => {
    const compressed = btoa(JSON.stringify(reasoningMap));
    const url = `${window.location.origin}/studio/${caseId}?map=${compressed}`;
    setShareUrl(url);
    setShowShareDialog(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleExportJSON} className="gap-2">
            <FileJson className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Export as JSON</span>
              <span className="text-xs text-muted-foreground">Save your reasoning map</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
            <FileText className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Export as PDF</span>
              <span className="text-xs text-muted-foreground">Print-friendly format</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Share Link</span>
              <span className="text-xs text-muted-foreground">Create shareable URL</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowImportDialog(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            <div className="flex flex-col">
              <span>Import Map</span>
              <span className="text-xs text-muted-foreground">Load from JSON file</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Reasoning Map</DialogTitle>
            <DialogDescription>
              Paste your exported JSON data or upload a file.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Or Paste JSON</Label>
              <Textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste your exported JSON here..."
                className="min-h-[200px] font-mono text-xs"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!importData.trim()}>
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Share Your Reasoning Map</DialogTitle>
            <DialogDescription>
              Anyone with this link can view your reasoning map.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button onClick={copyToClipboard} size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Note: This creates a snapshot of your current map. Changes after sharing won&apos;t be reflected in the shared link.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
