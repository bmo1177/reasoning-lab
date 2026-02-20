import { ReasoningMap } from '@/types/case';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportData {
  version: string;
  exportedAt: string;
  caseId: string;
  caseTitle: string;
  reasoningMap: ReasoningMap;
  metadata: {
    totalNodes: number;
    totalConnections: number;
    diagnoses: number;
    symptoms: number;
    findings: number;
    tests: number;
    exportDuration: number;
  };
}

export function exportToJSON(
  caseId: string,
  caseTitle: string,
  reasoningMap: ReasoningMap
): string {
  const startTime = performance.now();
  
  const diagnoses = reasoningMap.nodes.filter(n => n.type === 'diagnosis').length;
  const symptoms = reasoningMap.nodes.filter(n => n.type === 'symptom').length;
  const findings = reasoningMap.nodes.filter(n => n.type === 'finding').length;
  const tests = reasoningMap.nodes.filter(n => n.type === 'test').length;
  
  const exportData: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    caseId,
    caseTitle,
    reasoningMap,
    metadata: {
      totalNodes: reasoningMap.nodes.length,
      totalConnections: reasoningMap.connections.length,
      diagnoses,
      symptoms,
      findings,
      tests,
      exportDuration: performance.now() - startTime,
    },
  };
  
  return JSON.stringify(exportData, null, 2);
}

export function downloadJSON(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function validateImportData(data: unknown): data is ExportData {
  if (typeof data !== 'object' || data === null) return false;
  
  const exportData = data as Partial<ExportData>;
  
  return (
    typeof exportData.version === 'string' &&
    typeof exportData.caseId === 'string' &&
    typeof exportData.caseTitle === 'string' &&
    typeof exportData.exportedAt === 'string' &&
    exportData.reasoningMap !== null &&
    typeof exportData.reasoningMap === 'object' &&
    Array.isArray(exportData.reasoningMap.nodes) &&
    Array.isArray(exportData.reasoningMap.connections)
  );
}

export async function exportToPDF(
  element: HTMLElement,
  filename: string,
  title: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });
  
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  
  // Add title
  pdf.setFontSize(16);
  pdf.text(title, margin, margin + 5);
  
  // Add timestamp
  pdf.setFontSize(10);
  pdf.text(`Exported: ${new Date().toLocaleString()}`, margin, margin + 12);
  
  // Calculate image dimensions to fit page
  const imgWidth = pageWidth - (margin * 2);
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const availableHeight = pageHeight - margin * 2 - 20;
  
  const finalHeight = Math.min(imgHeight, availableHeight);
  const finalWidth = (canvas.width * finalHeight) / canvas.height;
  
  pdf.addImage(imgData, 'PNG', margin, margin + 18, finalWidth, finalHeight);
  
  pdf.save(filename);
}

export function generateShareableLink(caseId: string, mapData: ReasoningMap): string {
  const compressed = btoa(JSON.stringify(mapData));
  return `${window.location.origin}/studio/${caseId}?shared=${compressed}`;
}

export function parseSharedMap(encoded: string): ReasoningMap | null {
  try {
    const decoded = atob(encoded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
