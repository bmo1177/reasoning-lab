/**
 * Feedback Router Service
 *
 * Implements the Feedback Routing bridges from the domain model.
 * Routes feedback to:
 * 1. The active simulation (FeedbackToSimulation) -> Returns formatted feedback for UI
 * 2. The learner profile (FeedbackToProfile) -> Updates competency state in DB
 */

import type {
    Feedback,
    FeedbackToSimulation,
    FeedbackToProfile,
    DigitalTrace
} from '@/types/domainModel';
import { updateUserSkillProfile, getUserSkillProfile } from '@/services/analyticsService';

export class FeedbackRouter {

    /**
     * Route feedback to the active simulation context.
     * In a reactive system, this might trigger a UI event.
     * Here it formats and logs the delivery.
     */
    public routeToSimulation(
        feedback: Feedback,
        trace: DigitalTrace | null,
        sessionId: string,
        stageId: string
    ): FeedbackToSimulation {
        // Construct the bridge object
        const bridge: FeedbackToSimulation = {
            feedbackId: feedback.id,
            digitalTrace: trace,
            simulationSessionId: sessionId,
            stageId: stageId,
        };

        console.log(`[FeedbackRouter] Delivered ${feedback.type} feedback: "${feedback.content}"`);
        return bridge;
    }

    /**
     * Route feedback outcomes to the learner profile.
     * Updates the user's competence state based on the feedback interaction.
     */
    public async routeToProfile(
        userId: string,
        feedbackId: string,
        competencyNodeIds: string[],
        wasActedUpon: boolean,
        competencyDelta: number
    ): Promise<FeedbackToProfile> {

        // 1. Fetch current profile
        const profile = await getUserSkillProfile(userId);

        if (profile) {
            // 2. Calculate new state
            const currentMap = profile.competence_state || {};
            const updates: Record<string, number> = {};

            for (const nodeId of competencyNodeIds) {
                const current = currentMap[nodeId] || 0;
                // Clamp between 0 and 100
                updates[nodeId] = Math.max(0, Math.min(100, current + competencyDelta));
            }

            // 3. Persist update
            await updateUserSkillProfile(userId, {
                competence_state: {
                    ...currentMap,
                    ...updates
                }
            });
        }

        return {
            feedbackId,
            userId,
            wasActedUpon,
            competencyDelta
        };
    }
}

export const feedbackRouter = new FeedbackRouter();
