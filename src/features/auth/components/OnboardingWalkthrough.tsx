import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '@/shared/ui';
import { theme } from '@/shared/theme';

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
    padding: 20,
    backgroundColor: '#FDFBF9',
    borderColor: '#EFE7E1',
    borderRadius: 16,
    marginBottom: 20,
    position: 'relative',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    zIndex: 10,
  },
  closeText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  desc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 20,
    backgroundColor: theme.colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  nextText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

