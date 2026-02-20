import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Database, 
  Trash2, 
  User, 
  TrendingUp, 
  AlertTriangle, 
  Award,
  GraduationCap,
  MoreHorizontal,
  Download,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { 
  applyDemoScenario, 
  saveMockHistoryToStorage,
  clearMockData,
  exportAnalyticsData,
  importAnalyticsData,
  DEMO_SCENARIOS,
} from '@/services/mockDataService';
import { cn } from '@/lib/utils';

interface MockDataControlsProps {
  onScenarioApplied: () => void;
  onClearData: () => void;
}

export function MockDataControls({ onScenarioApplied, onClearData }: MockDataControlsProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [customCaseCount, setCustomCaseCount] = useState(15);
  const [customAccuracy, setCustomAccuracy] = useState(70);

  const handleScenario = async (scenarioKey: keyof typeof DEMO_SCENARIOS) => {
    if (!user?.id) return;
    
    setIsGenerating(true);
    try {
      const result = applyDemoScenario(user.id, scenarioKey);
      console.log('✅ Scenario applied:', result.message);
      onScenarioApplied();
    } catch (error) {
      console.error('Error applying scenario:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomGenerate = async () => {
    if (!user?.id) return;
    
    setIsGenerating(true);
    try {
      const stats = saveMockHistoryToStorage(user.id, {
        totalCases: customCaseCount,
        averageAccuracy: customAccuracy,
      });
      console.log('✅ Custom data generated:', stats);
      onScenarioApplied();
    } catch (error) {
      console.error('Error generating data:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure? This will delete all analytics data from localStorage.')) {
      clearMockData();
      onClearData();
      console.log('🗑️ All analytics data cleared');
    }
  };

  const handleExport = () => {
    const data = exportAnalyticsData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `think-studio-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const success = importAnalyticsData(event.target?.result as string);
        if (success) {
          console.log('✅ Data imported successfully');
          onScenarioApplied();
        } else {
          alert('Failed to import data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4" />
          Mock Data Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Scenarios */}
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground">Quick Scenarios</Label>
          <div className="grid grid-cols-2 gap-2">
            <ScenarioButton
              icon={GraduationCap}
              label="Beginner"
              description="Struggling student"
              onClick={() => handleScenario('beginner')}
              disabled={isGenerating}
              color="red"
            />
            <ScenarioButton
              icon={TrendingUp}
              label="Improving"
              description="Steady progress"
              onClick={() => handleScenario('intermediate')}
              disabled={isGenerating}
              color="blue"
            />
            <ScenarioButton
              icon={Award}
              label="Advanced"
              description="High performer"
              onClick={() => handleScenario('advanced')}
              disabled={isGenerating}
              color="green"
            />
            <ScenarioButton
              icon={AlertTriangle}
              label="Struggling"
              description="Needs help"
              onClick={() => handleScenario('struggling')}
              disabled={isGenerating}
              color="orange"
            />
          </div>
        </div>

        {/* Custom Generation */}
        <div className="space-y-3 pt-2 border-t">
          <Label className="text-xs uppercase text-muted-foreground">Custom Generation</Label>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Cases: {customCaseCount}</span>
            </div>
            <Slider
              value={[customCaseCount]}
              onValueChange={(value) => setCustomCaseCount(value[0])}
              min={5}
              max={50}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Avg Accuracy: {customAccuracy}%</span>
            </div>
            <Slider
              value={[customAccuracy]}
              onValueChange={(value) => setCustomAccuracy(value[0])}
              min={30}
              max={95}
              step={5}
            />
          </div>

          <Button 
            onClick={handleCustomGenerate} 
            disabled={isGenerating}
            className="w-full"
            variant="outline"
          >
            {isGenerating ? 'Generating...' : 'Generate Custom Data'}
          </Button>
        </div>

        {/* Management Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-1">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Data Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClear} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function ScenarioButton({ 
  icon: Icon, 
  label, 
  description, 
  onClick, 
  disabled,
  color,
}: {
  icon: any;
  label: string;
  description: string;
  onClick: () => void;
  disabled: boolean;
  color: 'red' | 'blue' | 'green' | 'orange';
}) {
  const colors = {
    red: 'hover:bg-red-50 hover:border-red-200',
    blue: 'hover:bg-blue-50 hover:border-blue-200',
    green: 'hover:bg-green-50 hover:border-green-200',
    orange: 'hover:bg-orange-50 hover:border-orange-200',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center p-3 border rounded-lg transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        colors[color]
      )}
    >
      <Icon className={cn("h-5 w-5 mb-1", `text-${color}-500`)} />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}
