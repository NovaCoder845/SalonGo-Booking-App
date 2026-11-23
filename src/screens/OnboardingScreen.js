import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

const TEXTS = {
  en: {
    skip: 'Skip',
    next: 'Next',
    start: 'Get Started',
    slides: [
      {
        title: 'Find salons near you',
        body: 'Browse salons near you, sorted by distance, and see their services, photos and reviews.',
      },
      {
        title: 'Book in a few taps',
        body: "Pick a service, choose an open slot, and you're booked — no calls, no waiting.",
      },
      {
        title: 'Never miss an appointment',
        body: 'Get reminders before your visit and manage everything from one place.',
      },
    ],
  },
  fr: {
    skip: 'Passer',
    next: 'Suivant',
    start: 'Commencer',
    slides: [
      {
        title: 'Trouvez des salons près de vous',
        body: 'Parcourez les salons proches, triés par distance, et découvrez leurs services, photos et avis.',
      },
      {
        title: 'Réservez en quelques touches',
        body: 'Choisissez un service, un créneau libre, et c’est réservé — sans appel, sans attente.',
      },
      {
        title: 'Ne ratez plus un rendez-vous',
        body: 'Recevez des rappels avant votre visite et gérez tout au même endroit.',
      },
    ],
  },
};

// The icons stay the same for every language
const SLIDE_ICONS = ['search', 'calendar', 'notifications'];

function HeroArt({ icon }) {
  return (
    <LinearGradient
      colors={['#D85A30', '#A6499B', '#534AB7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={[styles.heroCircle, styles.heroCircleLg]} />
      <View style={[styles.heroCircle, styles.heroCircleSm]} />
      <View style={styles.heroBadge}>
        <Ionicons name={icon} size={44} color="#D85A30" />
      </View>
      <View style={styles.sparkle}>
        <Ionicons name="sparkles" size={20} color="#F2A541" />
      </View>
    </LinearGradient>
  );
}

export default function OnboardingScreen({ onDone }) {
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];
  const SLIDES = L.slides.map((slide, i) => ({ key: String(i), icon: SLIDE_ICONS[i], ...slide }));

  const [index, setIndex] = useState(0);
  const listRef = useRef(null);

  const handleScroll = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current.scrollToIndex({ index: index + 1 });
    } else {
      onDone();
    }
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.skip} onPress={onDone}>
        <Text style={styles.skipText}>{L.skip}</Text>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onMomentumScrollEnd={handleScroll}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width }}>
            <HeroArt icon={item.icon} />
            <View style={styles.textBlock}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.cta} onPress={next}>
        <Text style={styles.ctaText}>{isLast ? L.start : L.next}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8F3',
  },
  skip: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: '#888780',
    fontSize: 14,
    fontWeight: '600',
  },
  hero: {
    height: 320,
    marginTop: 40,
    marginHorizontal: 20,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroCircleLg: {
    width: 220,
    height: 220,
    top: -60,
    right: -60,
  },
  heroCircleSm: {
    width: 120,
    height: 120,
    bottom: -30,
    left: -30,
  },
  heroBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: 28,
    left: 32,
  },
  textBlock: {
    paddingHorizontal: 32,
    marginTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: '#888780',
    textAlign: 'center',
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8D9CE',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 22,
    backgroundColor: '#D85A30',
  },
  cta: {
    backgroundColor: '#D85A30',
    marginHorizontal: 24,
    marginBottom: 36,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});