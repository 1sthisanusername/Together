import React from 'react';
import { z } from 'zod';
import { WouldYouRatherRenderer } from '@/features/sessions/renderers/WouldYouRatherRenderer';
import { WhoKnowsWhomRenderer } from '@/features/sessions/renderers/WhoKnowsWhomRenderer';
import { GuessMyAnswerRenderer } from '@/features/sessions/renderers/GuessMyAnswerRenderer';
import { QuizRenderer } from '@/features/sessions/renderers/QuizRenderer';
import { GuidedDateRenderer } from '@/features/sessions/renderers/GuidedDateRenderer';
import { PhotoMissionRenderer } from '@/features/sessions/renderers/PhotoMissionRenderer';
import type { SessionData } from '@/features/sessions/hooks/useSession';
import { LoadingState } from '@/shared/ui';

// Lazy-load heavy drawing game component to reduce initial bundle parse time
const LazyDrawingGuessRenderer = React.lazy(() =>
  import('@/features/sessions/renderers/DrawingGuessRenderer').then((m) => ({
    default: m.DrawingGuessRenderer,
  }))
);

const LazyDrawingWrapper: React.FC<ActivityRendererProps> = (props) =>
  React.createElement(
    React.Suspense,
    { fallback: React.createElement(LoadingState, { message: 'Loading canvas...' }) },
    React.createElement(LazyDrawingGuessRenderer, props)
  );

export interface ActivityRendererProps {
  data: SessionData;
  partnerName: string;
  onFinish: () => void;
}

export interface ActivityRegistryEntry {
  Component: React.ComponentType<ActivityRendererProps>;
  configSchema: z.ZodTypeAny;
}

export const activityRegistry: Record<string, ActivityRegistryEntry> = {
  would_you_rather: {
    Component: WouldYouRatherRenderer,
    configSchema: z.object({
      rounds: z.array(
        z.object({
          id: z.number(),
          question: z.string(),
          optionA: z.string(),
          optionB: z.string(),
        })
      ),
    }),
  },
  who_knows_whom: {
    Component: WhoKnowsWhomRenderer,
    configSchema: z.object({
      rounds: z.array(
        z.object({
          id: z.number(),
          prompt: z.string(),
          target: z.string(),
          type: z.string().optional(),
          options: z.array(z.string()).optional(),
        })
      ),
    }),
  },
  guess_my_answer: {
    Component: GuessMyAnswerRenderer,
    configSchema: z.object({
      rounds: z.array(
        z.object({
          id: z.number(),
          question: z.string(),
          options: z.array(z.string()),
        })
      ),
    }),
  },
  drawing_guess: {
    Component: LazyDrawingWrapper,
    configSchema: z.object({
      rounds: z.array(
        z.object({
          id: z.number(),
          drawer: z.string(),
          prompt: z.string(),
        })
      ),
    }),
  },
  quiz: {
    Component: QuizRenderer,
    configSchema: z.object({
      rounds: z.array(
        z.object({
          id: z.number(),
          question: z.string(),
          options: z.array(z.string()).optional(),
          type: z.string().optional(),
        })
      ),
    }),
  },
  photo_mission: {
    Component: PhotoMissionRenderer,
    configSchema: z.object({
      prompt: z.string(),
      instructions: z.string(),
      rewardMessage: z.string(),
    }),
  },
  guided_date: {
    Component: GuidedDateRenderer,
    configSchema: z.object({
      steps: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          prompt: z.string().optional(),
          description: z.string().optional(),
          duration_minutes: z.number().optional(),
          timer_minutes: z.number().optional(),
          checklist: z.array(z.string()).optional(),
        })
      ),
    }),
  },
};

export function getActivityRenderer(kind: string): ActivityRegistryEntry {
  const entry = activityRegistry[kind];
  if (!entry) {
    // Default fallback to QuizRenderer
    return activityRegistry.quiz;
  }
  return entry;
}

