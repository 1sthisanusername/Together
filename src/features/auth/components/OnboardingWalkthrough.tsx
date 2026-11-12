import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '@/shared/ui';
import { theme, scale } from '@/shared/theme';

const SLIDES = [
  {
    emoji: '💌',
    title: 'A Private Space for Two',
    desc: 'Together is designed exclusively for you and your partner. No social feeds, no read receipts, no distractions.',
  },
  {
    emoji: '🎮',
    title: 'Fun Activities & Games',
    desc: 'Play server-authoritative multiplayer games, take couple quizzes, and embark on photo missions together.',
  },
  {
    emoji: '🎙️',
    title: 'Voice Notes & Open When Letters',
    desc: 'Send cozy voice notes and schedule heartfelt letters to unlock on special moments.',
  },
];

export const OnboardingWalkthrough: React.FC = () => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const currentSlide = SLIDES[slideIndex];

  const handleNext = () => {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      setDismissed(true);
    }
  };

  return (
    <Card style={styles.card}>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => setDismissed(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.emoji}>{currentSlide.emoji}</Text>
      <Text style={styles.title}>{currentSlide.title}</Text>
      <Text style={styles.desc}>{currentSlide.desc}</Text>

      {/* Dots Indicator */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setSlideIndex(idx)}
            style={[styles.dot, idx === slideIndex && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity onPress={() => setDismissed(true)}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>
            {slideIndex === SLIDES.length - 1 ? 'Get Started' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: scale(20),
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.lg,
    marginBottom: scale(20),
    position: 'relative',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: scale(14),
    right: scale(14),
    padding: scale(6),
    zIndex: 10,
  },
  closeText: {
    fontSize: scale(16),
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  emoji: {
    fontSize: scale(40),
    marginBottom: scale(10),
    textAlign: 'center',
  },
  title: {
    fontSize: scale(18),
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scale(6),
  },
  desc: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(20),
    marginBottom: scale(16),
    paddingHorizontal: scale(10),
  },
  dotsRow: {
    flexDirection: 'row',
    gap: scale(6),
    marginBottom: scale(16),
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: 9999,
    backgroundColor: theme.colors.surfaceDisabled,
  },
  dotActive: {
    width: scale(20),
    backgroundColor: theme.colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(8),
  },
  skipText: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: theme.roundness.full,
  },
  nextText: {
    fontSize: scale(13),
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

