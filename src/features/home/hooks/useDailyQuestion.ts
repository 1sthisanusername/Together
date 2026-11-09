import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import { getDailyQuestionForDate, type DailyQuestion } from '../data/dailyQuestions';

export interface DailyQuestionState {
  question: DailyQuestion;
  questionDate: string;
  myAnswer: string | null;
  partnerAnswer: string | null;
  hasMyAnswer: boolean;
  hasBothAnswered: boolean;
  streak: number;
}

export function useDailyQuestion() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();
  const coupleId = coupleData?.couple?.id;
  const partnerId = coupleData?.partner?.id;

  // Local YYYY-MM-DD string
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  const question = getDailyQuestionForDate(todayStr);

  const queryKey = ['daily_question', coupleId, todayStr];

  const query = useQuery<DailyQuestionState>({
    queryKey,
    enabled: !!coupleId && !!user?.id,
    queryFn: async () => {
      if (!coupleId || !user?.id) {
        return {
          question,
          questionDate: todayStr,
          myAnswer: null,
          partnerAnswer: null,
          hasMyAnswer: false,
          hasBothAnswered: false,
          streak: 0,
        };
      }

      // 1. Fetch answers for today from daily_question_answers
      const { data: answers, error } = await (supabase.from as any)(
        'daily_question_answers'
      )
        .select('*')
        .eq('couple_id', coupleId)
        .eq('question_date', todayStr);

      if (error) {
        console.warn('[useDailyQuestion] Error fetching answers:', error.message);
      }

      let myAns: string | null = null;
      let partnerAns: string | null = null;

      if (answers && Array.isArray(answers)) {
        for (const row of answers as any[]) {
          if (row.user_id === user.id) {
            myAns = row.answer;
          } else if (row.user_id === partnerId) {
            partnerAns = row.answer;
          }
        }
      }

      // 2. Fetch current streak
      let streakCount = 0;
      try {
        const { data: streakData } = await (supabase.rpc as any)(
          'get_daily_question_streak',
          { p_couple_id: coupleId }
        );
        if (typeof streakData === 'number') {
          streakCount = streakData;
        }
      } catch {}

      return {
        question,
        questionDate: todayStr,
        myAnswer: myAns,
        partnerAnswer: partnerAns,
        hasMyAnswer: !!myAns,
        hasBothAnswered: !!myAns && !!partnerAns,
        streak: streakCount,
      };
    },
  });

  // Realtime subscription: trigger re-fetch when partner submits their answer
  useEffect(() => {
    if (!coupleId) return;

    const channel = supabase
      .channel(`daily_q_${coupleId}_${todayStr}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_question_answers',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, todayStr, queryClient]);

  const submitMutation = useMutation({
    mutationFn: async (answerText: string) => {
      if (!user?.id || !coupleId) throw new Error('Not authenticated');

      const trimmed = answerText.trim();
      if (!trimmed) throw new Error('Answer cannot be empty');

      // Optimistically update
      queryClient.setQueryData<DailyQuestionState>(queryKey, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          myAnswer: trimmed,
          hasMyAnswer: true,
        };
      });

      const { data, error } = await (supabase.from as any)(
        'daily_question_answers'
      )
        .upsert(
          {
            couple_id: coupleId,
            user_id: user.id,
            question_date: todayStr,
            question_text: question.text,
            answer: trimmed,
          },
          { onConflict: 'couple_id, user_id, question_date' }
        )
        .select('*')
        .single();

      if (error) {
        queryClient.invalidateQueries({ queryKey });
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...query,
    submitAnswer: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
  };
}

export interface DailyQuestionHistoryEntry {
  questionDate: string;
  questionText: string;
  myAnswer: string | null;
  partnerAnswer: string | null;
  hasBothAnswered: boolean;
}

export function useDailyQuestionHistory() {
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();
  const coupleId = coupleData?.couple?.id;
  const partnerId = coupleData?.partner?.id;

  return useQuery<DailyQuestionHistoryEntry[]>({
    queryKey: ['daily_question_history', coupleId],
    enabled: !!coupleId && !!user?.id,
    queryFn: async () => {
      if (!coupleId || !user?.id) return [];
      const { data, error } = await (supabase.from as any)('daily_question_answers')
        .select('*')
        .eq('couple_id', coupleId)
        .order('question_date', { ascending: false });

      if (error || !data) return [];

      const map = new Map<
        string,
        {
          date: string;
          question: string;
          myAns: string | null;
          partnerAns: string | null;
        }
      >();

      for (const row of data as any[]) {
        const existing = map.get(row.question_date) || {
          date: row.question_date,
          question: row.question_text || 'Daily Prompt',
          myAns: null,
          partnerAns: null,
        };
        if (row.user_id === user.id) {
          existing.myAns = row.answer;
        } else if (row.user_id === partnerId) {
          existing.partnerAns = row.answer;
        }
        if (row.question_text) existing.question = row.question_text;
        map.set(row.question_date, existing);
      }

      return Array.from(map.values()).map((item) => ({
        questionDate: item.date,
        questionText: item.question,
        myAnswer: item.myAns,
        partnerAnswer: item.partnerAns,
        hasBothAnswered: !!item.myAns && !!item.partnerAns,
      }));
    },
  });
}
