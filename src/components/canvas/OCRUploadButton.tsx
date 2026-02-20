import { useState, useRef } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface OCRUploadButtonProps {
  onGraphImported?: (nodes: any[], edges: any[]) => void;
}

export function OCRUploadButton({ onGraphImported }: OCRUploadButtonProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!preview) return;
    
    setIsProcessing(true);
    
    // Placeholder for future OCR integration
    setTimeout(() => {
      setIsProcessing(false);
      toast.info('OCR processing is coming soon! This feature will convert your hand-drawn reasoning maps into digital graphs using AI vision models.');
      setOpen(false);
      setPreview(null);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setPreview(null); }}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Camera className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">Import from Photo (OCR)</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Reasoning Map from Photo</DialogTitle>
          <DialogDescription>
            Upload a photo of a hand-drawn reasoning map (from a printed worksheet or whiteboard) to convert it into a digital graph.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!preview ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-accent/30 transition-colors cursor-pointer"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Click to upload image</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border">
                <img src={preview} alt="Uploaded reasoning map" className="w-full max-h-64 object-contain bg-muted/30" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setPreview(null); fileInputRef.current?.click(); }}
                >
                  Change Image
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleProcess}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Convert to Graph
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                🚧 OCR conversion coming soon — will use AI vision to detect nodes and connections from your drawing.
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
