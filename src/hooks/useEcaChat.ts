/**
 * ECA Chat State Management Hook
 * 
 * Manages conversation state for the Embedded Conversational Agent.
 * Integrates with ecaService for real error detection and hint generation.
 * 
 * Phase 2.1: Client-side state + UI
 * Phase 2.2: ecaService integration with errorDetector + hintEngine + rulesEngine
 * Phase 2.3: Will add Claude API calls via Supabase Edge Function
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { EcaMessage } from '@/components/simulation/EcaChatPanel';
import {
    createEcaSession,
    analyzeDecision,
    generateAIResponse,
    buildSessionSummary,
    type EcaContext,
    type EcaSessionState,
    type DecisionLogEntry,
} from '@/services/ecaService';
import type {
    BranchingCase,
    PatientState,
    SimulationDecision,
    SimulationStage,
} from '@/types/simulation';

// ======================
// Types
// ======================

interface UseEcaChatOptions {
    /** Simulation case title for context */
    caseTitle?: string;
    /** Whether the simulation is active */
    isActive: boolean;
}

interface UseEcaChatReturn {
    messages: EcaMessage[];
    isTyping: boolean;
    unreadCount: number;
    isPanelOpen: boolean;
    setIsPanelOpen: (open: boolean) => void;
    /** Learner sends a free-text message */
    sendMessage: (content: string) => void;
    /** ECA sends a direct message (used for welcome, system triggers) */
    addEcaMessage: (content: string, hint?: EcaMessage['hint'], suggestions?: string[]) => void;
    /** System message (e.g., "Simulation started") */
    addSystemMessage: (content: string) => void;
    /** Analyze a decision and possibly send ECA feedback */
    onDecisionMade: (
        decision: SimulationDecision,
        context: EcaContext,
    ) => void;
    /** Get session summary for persistence */
    getSessionSummary: () => ReturnType<typeof buildSessionSummary>;
    clearUnread: () => void;
    resetChat: () => void;
}

// ======================
// Helpers
// ======================

let messageIdCounter = 0;
function generateId(): string {
    return `msg-${++messageIdCounter}-${Date.now()}`;
}

// ======================
// Hook
// ======================

export function useEcaChat({ caseTitle, isActive }: UseEcaChatOptions): UseEcaChatReturn {
    const [messages, setMessages] = useState<EcaMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // ECA session state (tracks hint levels, errors, API calls)
    const ecaSessionRef = useRef<EcaSessionState>(createEcaSession());
    const typingTimeout = useRef<NodeJS.Timeout | null>(null);

    const handlePanelChange = useCallback((open: boolean) => {
        setIsPanelOpen(open);
        if (open) setUnreadCount(0);
    }, []);

    /**
     * Add an ECA message with typing delay for natural feel
     */
    const addEcaMessage = useCallback((
        content: string,
        hint?: EcaMessage['hint'],
        suggestions?: string[],
    ) => {
        const msg: EcaMessage = {
            id: generateId(),
            role: 'eca',
            content,
            timestamp: new Date(),
            hint,
            suggestions,
        };

        // Simulate typing delay
        setIsTyping(true);
        const delay = Math.min(1500, 300 + content.length * 8);

        if (typingTimeout.current) clearTimeout(typingTimeout.current);

        typingTimeout.current = setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, msg]);
            if (!isPanelOpen) {
                setUnreadCount(prev => prev + 1);
            }
        }, delay);
    }, [isPanelOpen]);

    const addSystemMessage = useCallback((content: string) => {
        setMessages(prev => [...prev, {
            id: generateId(),
            role: 'system',
            content,
            timestamp: new Date(),
        }]);
    }, []);

    /**
     * Handle learner free-text message → generate AI response
     */
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        // Add learner message immediately
        setMessages(prev => [...prev, {
            id: generateId(),
            role: 'learner',
            content,
            timestamp: new Date(),
        }]);

        // Generate response via ecaService (local fallback for now)
        // This will use Claude API once Task 2.3 Edge Function is deployed
        const fakeContext: EcaContext = {
            caseData: { title: caseTitle || 'Case', specialty: 'general' } as BranchingCase,
            currentStage: { id: 'current', name: 'Current Stage' } as SimulationStage,
            patientState: {
                status: 'stable',
                vitalSigns: { bloodPressure: '120/80', heartRate: 80, respiratoryRate: 16, temperature: 37, oxygenSaturation: 98 },
                symptoms: [],
                timeElapsed: 0,
            },
            decisionsLog: [],
            timeInStage: 0,
            difficulty: 'intermediate',
        };

        const { response, updatedState } = await generateAIResponse(
            content,
            fakeContext,
            ecaSessionRef.current,
        );

        ecaSessionRef.current = updatedState;

        addEcaMessage(
            response.content,
            response.hint,
            response.suggestions,
        );
    }, [addEcaMessage, caseTitle]);

    /**
     * Called after each decision to run error detection → hint generation
     */
    const onDecisionMade = useCallback((
        decision: SimulationDecision,
        context: EcaContext,
    ) => {
        const { response, updatedState } = analyzeDecision(
            decision,
            context,
            ecaSessionRef.current,
        );

        ecaSessionRef.current = updatedState;

        if (response) {
            addEcaMessage(
                response.content,
                response.hint,
                response.suggestions,
            );
        }
    }, [addEcaMessage]);

    const getSessionSummary = useCallback(() => {
        return buildSessionSummary(ecaSessionRef.current);
    }, []);

    const clearUnread = useCallback(() => {
        setUnreadCount(0);
    }, []);

    const resetChat = useCallback(() => {
        setMessages([]);
        setUnreadCount(0);
        setIsTyping(false);
        ecaSessionRef.current = createEcaSession();
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
    }, []);

    return {
        messages,
        isTyping,
        unreadCount,
        isPanelOpen,
        setIsPanelOpen: handlePanelChange,
        sendMessage,
        addEcaMessage,
        addSystemMessage,
        onDecisionMade,
        getSessionSummary,
        clearUnread,
        resetChat,
    };
}
