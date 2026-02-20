import { useState, useCallback } from 'react';
import { ReasoningMap } from '@/types/case';

export interface GraphComparisonResult {
  sharedConcepts: string[];
  uniqueToStudent: string[];
  uniqueToExpert: string[];
  reasoningAlignment: string;
  gapsAndRecommendations: string[];
  overallAssessment: string;
  semanticMatches: Array<{
    studentDiagnosis: string;
    expertDiagnosis: string;
    confidence: number;
    explanation: string;
  }>;
  rawAnalysis: string;
}

interface UseGraphComparisonReturn {
  compare: (studentMap: ReasoningMap, expertMap: ReasoningMap) => Promise<void>;
  result: GraphComparisonResult | null;
  isLoading: boolean;
  error: string | null;
  clear: () => void;
}

export function useGraphComparison(): UseGraphComparisonReturn {
  const [result, setResult] = useState<GraphComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compare = useCallback(async (studentMap: ReasoningMap, expertMap: ReasoningMap) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/graph-intersection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graph1: {
            nodes: studentMap.nodes.map(n => ({ id: n.id, type: n.type, label: n.label })),
            connections: studentMap.connections.map(c => ({ 
              source: c.sourceId, 
              target: c.targetId, 
              type: c.type 
            })),
          },
          graph2: {
            nodes: expertMap.nodes.map(n => ({ id: n.id, type: n.type, label: n.label })),
            connections: expertMap.connections.map(c => ({ 
              source: c.sourceId, 
              target: c.targetId, 
              type: c.type 
            })),
          },
          analysisType: 'semantic-comparison',
          includeSemanticMatching: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Parse the AI analysis to extract structured data
      const parsedResult = parseAnalysis(data.analysis);
      setResult(parsedResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { compare, result, isLoading, error, clear };
}

function parseAnalysis(analysisText: string): GraphComparisonResult {
  // Default empty structure
  const result: GraphComparisonResult = {
    sharedConcepts: [],
    uniqueToStudent: [],
    uniqueToExpert: [],
    reasoningAlignment: '',
    gapsAndRecommendations: [],
    overallAssessment: '',
    semanticMatches: [],
    rawAnalysis: analysisText,
  };

  try {
    // Extract shared concepts
    const sharedMatch = analysisText.match(/\*\*Shared Concepts\*\*[:\s]*([^*]+)/i);
    if (sharedMatch) {
      result.sharedConcepts = sharedMatch[1]
        .split(/[\n,]/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('-'));
    }

    // Extract unique to graph 1 (student)
    const unique1Match = analysisText.match(/\*\*Unique to Graph 1\*\*[:\s]*([^*]+)/i);
    if (unique1Match) {
      result.uniqueToStudent = unique1Match[1]
        .split(/[\n,]/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('-'));
    }

    // Extract unique to graph 2 (expert)
    const unique2Match = analysisText.match(/\*\*Unique to Graph 2\*\*[:\s]*([^*]+)/i);
    if (unique2Match) {
      result.uniqueToExpert = unique2Match[1]
        .split(/[\n,]/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('-'));
    }

    // Extract reasoning alignment
    const alignmentMatch = analysisText.match(/\*\*Reasoning Alignment\*\*[:\s]*([^*]+(?:\n[^*]+)*)/i);
    if (alignmentMatch) {
      result.reasoningAlignment = alignmentMatch[1].trim();
    }

    // Extract gaps and recommendations
    const gapsMatch = analysisText.match(/\*\*Gaps[^*]+Recommendations\*\*[:\s]*([^*]+(?:\n[^*]+)*)/i);
    if (gapsMatch) {
      result.gapsAndRecommendations = gapsMatch[1]
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0 && (s.startsWith('-') || s.startsWith('•')))
        .map(s => s.replace(/^[-•]\s*/, ''));
    }

    // Extract overall assessment
    const assessmentMatch = analysisText.match(/\*\*Overall Assessment\*\*[:\s]*([^*]+(?:\n[^*]+)*)/i);
    if (assessmentMatch) {
      result.overallAssessment = assessmentMatch[1].trim();
    }

    // Try to parse semantic matches (new section)
    const semanticMatch = analysisText.match(/\*\*Semantic Matches\*\*[:\s]*([^*]+(?:\n[^*]+)*)/i);
    if (semanticMatch) {
      const lines = semanticMatch[1].split('\n').filter(l => l.trim());
      result.semanticMatches = lines.map(line => {
        // Pattern: "Student Item" ≈ "Expert Item" (85%) - explanation
        const match = line.match(/["']?([^"']+)["']?\s*[≈~]\s*["']?([^"']+)["']?\s*\((\d+)%\)\s*-?\s*(.*)/i);
        if (match) {
          return {
            studentDiagnosis: match[1].trim(),
            expertDiagnosis: match[2].trim(),
            confidence: parseInt(match[3], 10),
            explanation: match[4]?.trim() || '',
          };
        }
        return null;
      }).filter(Boolean) as typeof result.semanticMatches;
    }

  } catch (e) {
    console.error('Error parsing analysis:', e);
  }

  return result;
}
