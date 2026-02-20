import type { SimulationDecision, BranchingCase, SimulationStage } from '@/types/simulation';
import type { WhatIfScenario } from '@/types/analytics';

/**
 * Generate what-if scenarios for a given decision
 * Creates alternative paths showing what would happen with different choices
 */
export function generateWhatIfScenarios(
  actualDecision: SimulationDecision,
  caseData: BranchingCase,
  currentStage?: SimulationStage
): WhatIfScenario[] {
  const scenarios: WhatIfScenario[] = [];
  
  // Get all available decisions in the current stage
  const availableDecisions = currentStage?.availableDecisions || 
    caseData.stages.flatMap(s => s.availableDecisions);
  
  // Filter out the actual decision
  const alternativeDecisions = availableDecisions.filter(d => d.id !== actualDecision.id);
  
  // Generate scenarios for top 3 alternatives
  alternativeDecisions.slice(0, 3).forEach((decision, index) => {
    const scenario = createScenario(actualDecision, decision, caseData, index);
    scenarios.push(scenario);
  });
  
  return scenarios;
}

/**
 * Create a single what-if scenario
 */
function createScenario(
  actualDecision: SimulationDecision,
  alternativeDecision: SimulationDecision,
  caseData: BranchingCase,
  index: number
): WhatIfScenario {
  // Determine predicted outcome based on decision properties
  let predictedOutcome: 'better' | 'worse' | 'similar' | 'different' | null = 'different';
  
  // Check if this is on the optimal path
  const isOptimalAlternative = caseData.optimalPath?.decisions.includes(alternativeDecision.id);
  const wasActualOptimal = caseData.optimalPath?.decisions.includes(actualDecision.id);
  
  if (isOptimalAlternative && !wasActualOptimal) {
    predictedOutcome = 'better';
  } else if (!isOptimalAlternative && wasActualOptimal) {
    predictedOutcome = 'worse';
  } else if (isOptimalAlternative === wasActualOptimal) {
    predictedOutcome = 'similar';
  }
  
  // Generate scenario description
  const scenarioDescription = generateScenarioDescription(
    actualDecision,
    alternativeDecision,
    predictedOutcome
  );
  
  // Generate explanation
  const explanation = generateExplanation(actualDecision, alternativeDecision, caseData);
  
  // Generate key insight
  const keyInsight = generateKeyInsight(alternativeDecision, caseData);
  
  return {
    id: `scenario-${index}-${Date.now()}`,
    simulation_session_id: '', // Will be set when saving
    stage_id: '', // Will be set when saving
    decision_made: actualDecision.id,
    decision_made_label: actualDecision.label,
    alternative_decision: alternativeDecision.id,
    alternative_decision_label: alternativeDecision.label,
    scenario_title: `Alternative: ${alternativeDecision.label}`,
    scenario_description: scenarioDescription,
    predicted_outcome: predictedOutcome,
    predicted_patient_state: null, // Would need simulation logic
    explanation: explanation,
    learning_objective: alternativeDecision.consequences.newInformationRevealed || null,
    key_insight: keyInsight,
    was_viewed: false,
    was_explored: false,
    explored_at: null,
    created_at: new Date().toISOString(),
  };
}

/**
 * Generate a description of what would happen with the alternative decision
 */
function generateScenarioDescription(
  actualDecision: SimulationDecision,
  alternativeDecision: SimulationDecision,
  outcome: string | null
): string {
  const consequences = alternativeDecision.consequences;
  
  let description = `Instead of "${actualDecision.label}", you chose "${alternativeDecision.label}". `;
  
  if (consequences.patientStateChange) {
    const status = consequences.patientStateChange.status;
    if (status === 'critical' || status === 'declining') {
      description += `The patient's condition would have deteriorated to ${status}. `;
    } else if (status === 'improving' || status === 'stable') {
      description += `The patient's condition would have improved or stabilized. `;
    }
  }
  
  if (consequences.newInformationRevealed) {
    description += `Additional information would have been revealed: ${consequences.newInformationRevealed}. `;
  }
  
  if (consequences.triggersBranch) {
    description += `This would have triggered a different clinical pathway. `;
  }
  
  // Add outcome comparison
  switch (outcome) {
    case 'better':
      description += 'This path would likely have led to a better overall outcome.';
      break;
    case 'worse':
      description += 'This path would likely have led to complications or delays.';
      break;
    case 'similar':
      description += 'The overall outcome would likely have been similar.';
      break;
    default:
      description += 'This would have resulted in a significantly different clinical course.';
  }
  
  return description;
}

/**
 * Generate clinical explanation for the alternative
 */
function generateExplanation(
  actualDecision: SimulationDecision,
  alternativeDecision: SimulationDecision,
  caseData: BranchingCase
): string {
  const explanations: string[] = [];
  
  // Compare costs
  if (alternativeDecision.cost < actualDecision.cost) {
    explanations.push(`This option costs $${actualDecision.cost - alternativeDecision.cost} less than your choice.`);
  } else if (alternativeDecision.cost > actualDecision.cost) {
    explanations.push(`This option costs $${alternativeDecision.cost - actualDecision.cost} more than your choice.`);
  }
  
  // Compare time
  if (alternativeDecision.timeRequired < actualDecision.timeRequired) {
    explanations.push(`This would have saved ${actualDecision.timeRequired - alternativeDecision.timeRequired} seconds.`);
  }
  
  // Type-specific explanations
  switch (alternativeDecision.type) {
    case 'test':
      explanations.push('Ordering this test would provide additional diagnostic information.');
      break;
    case 'treatment':
      explanations.push('This treatment option addresses the presenting symptoms directly.');
      break;
    case 'consultation':
      explanations.push('Consulting a specialist could provide expert guidance on complex aspects.');
      break;
    case 'observation':
      explanations.push('Observation allows for monitoring changes in the patient\'s condition.');
      break;
    case 'procedure':
      explanations.push('This procedure could address underlying issues identified in the assessment.');
      break;
    case 'question':
      explanations.push('Asking this question would gather more information from the patient.');
      break;
  }
  
  return explanations.join(' ') || 'This represents an alternative approach to managing the case.';
}

/**
 * Generate a key learning insight
 */
function generateKeyInsight(
  alternativeDecision: SimulationDecision,
  caseData: BranchingCase
): string {
  const insights: Record<string, string[]> = {
    test: [
      'Consider the diagnostic yield versus cost when ordering tests.',
      'Not all abnormal findings require immediate testing.',
      'The most expensive test is not always the most informative.',
    ],
    treatment: [
      'Always weigh the risks and benefits of interventions.',
      'Start with conservative measures before aggressive treatments.',
      'Consider patient preferences when selecting treatments.',
    ],
    consultation: [
      'Early consultation can prevent complications in complex cases.',
      'Know when to seek expert help versus managing independently.',
      'Consultation is particularly valuable for rare presentations.',
    ],
    observation: [
      'Observation is often the most appropriate initial approach.',
      'Time can be a valuable diagnostic tool.',
      'Avoid premature intervention when the diagnosis is unclear.',
    ],
    procedure: [
      'Ensure adequate preparation before performing procedures.',
      'Consider less invasive alternatives first.',
      'Document indications clearly for all procedures.',
    ],
    question: [
      'A thorough history often reveals the diagnosis.',
      'Don\'t underestimate the value of patient communication.',
      'Targeted questions are more valuable than broad screening.',
    ],
  };
  
  const typeInsights = insights[alternativeDecision.type] || ['Consider all available options before making decisions.'];
  
  // Return a random insight for variety
  return typeInsights[Math.floor(Math.random() * typeInsights.length)];
}

/**
 * Filter scenarios based on predicted outcome
 */
export function filterScenarios(
  scenarios: WhatIfScenario[],
  outcome: 'better' | 'worse' | 'similar' | 'different'
): WhatIfScenario[] {
  return scenarios.filter(s => s.predicted_outcome === outcome);
}

/**
 * Get scenario statistics
 */
export function getScenarioStats(scenarios: WhatIfScenario[]): {
  total: number;
  better: number;
  worse: number;
  similar: number;
  different: number;
  explored: number;
} {
  return {
    total: scenarios.length,
    better: scenarios.filter(s => s.predicted_outcome === 'better').length,
    worse: scenarios.filter(s => s.predicted_outcome === 'worse').length,
    similar: scenarios.filter(s => s.predicted_outcome === 'similar').length,
    different: scenarios.filter(s => s.predicted_outcome === 'different').length,
    explored: scenarios.filter(s => s.was_explored).length,
  };
}
