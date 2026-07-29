import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
  Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeroSectionDetails } from '../components/constants/onboarding';

const { width } = Dimensions.get('window');

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  // Save "true" to storage so the layout knows we are done with onboarding
  const completeOnboardingAndNavigate = async (targetRoute: string) => {
    try {
      await AsyncStorage.setItem("HAS_LAUNCHED", "true");
      router.replace(targetRoute);
    } catch (e) {
      console.error("Error saving status", e);
    }
  };

  const goToLogin = () => completeOnboardingAndNavigate('/');
  const goToRegister = () => completeOnboardingAndNavigate('/register');

  const handleNext = () => {
    const isLastSlide = currentIndex === HeroSectionDetails.length - 1;

    if (isLastSlide === false) {
      // Go to next slide
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      // Last slide -> finish and go to register
      goToRegister();
    }
  };

  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === HeroSectionDetails.length - 1;

  return (
    <View style={styles.container}>
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      <View style={[styles.mainWrapper, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.topHeader}>
          <View style={styles.logoRow}>
            <LinearGradient colors={['#16A085', '#1abc9c']} style={styles.logoCircle}>
              <MaterialCommunityIcons name="recycle" size={20} color="white" />
            </LinearGradient>
            <Text style={styles.logoText}>CleanHaul</Text>
          </View>
          <View style={styles.b2bBadge}>
            <Text style={styles.b2bText}>B2B • WASTE</Text>
          </View>
        </View>

        <Text style={styles.subHeadline}>The operations platform for modern waste management.</Text>

        <FlatList
          ref={flatListRef}
          data={HeroSectionDetails}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.flatListContent}
          renderItem={({ item, index }) => (
            <View style={styles.slide}>
              <LinearGradient
                colors={['#16A085', '#f59e0b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <FontAwesome5 name={item.icon} size={45} color="white" />
              </LinearGradient>

              <BlurView
                intensity={Platform.OS === 'ios' ? 50 : 100}
                tint="light"
                style={styles.glassCard}
              >
                <Text style={styles.header}>{item.header}</Text>
                <Text style={styles.description}>{item.description}</Text>

                <View style={styles.footerRow}>
                  {item.footer.map((tag, idx) => (
                    <View
                      key={idx}
                      style={[styles.tag, { backgroundColor: tag.backgroundColor }]}
                    >
                      <Text style={[styles.tagText, { color: tag.color }]}>
                        {tag.text}
                      </Text>
                    </View>
                  ))}
                </View>

                {index === HeroSectionDetails.length - 1 && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.ctaButton}
                    onPress={goToRegister}
                  >
                    <Text style={styles.ctaButtonText}>Create Company Account</Text>
                    <FontAwesome5 name="arrow-right" size={14} color="white" />
                  </TouchableOpacity>
                )}
              </BlurView>
            </View>
          )}
        />

        <View style={styles.bottomContainer}>
          <View style={styles.teaserRow}>
            <TeaserItem icon="truck" label="Dispatch" color="#16A085" />
            <TeaserItem icon="file-invoice" label="Receipts" color="#f59e0b" />
            <TeaserItem icon="shield-alt" label="Compliance" color="#16A085" />
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() =>
                flatListRef.current?.scrollToIndex({
                  index: Math.max(0, currentIndex - 1),
                })
              }
            >
              <Text style={[styles.navText, { opacity: isFirstSlide === true ? 0 : 1 }]}>
                Prev
              </Text>
            </TouchableOpacity>

            <View style={styles.dotContainer}>
              {HeroSectionDetails.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, currentIndex === i && styles.activeDot]}
                />
              ))}
            </View>

            <TouchableOpacity onPress={handleNext}>
              <Text style={[styles.navText, { opacity: isLastSlide === true ? 0 : 1 }]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionLinks}>
            <TouchableOpacity onPress={goToLogin}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
            <Text style={styles.divider}>•</Text>
            <TouchableOpacity onPress={goToRegister}>
              <Text style={styles.skipText}>Skip onboarding →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.copyright}>© 2026 CleanHaul • Smart • Reliable</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Helper Components ──────────────────────────────────────────────

function TeaserItem({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={styles.teaserItem}>
      <View style={[styles.teaserIcon, { backgroundColor: `${color}15` }]}>
        <FontAwesome5 name={icon} size={14} color={color} />
      </View>
      <Text style={styles.teaserLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  mainWrapper: { flex: 1, paddingHorizontal: 24 },
  blob: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.15,
  },
  blob1: { top: -150, left: -150, backgroundColor: '#16A085' },
  blob2: { bottom: -150, right: -150, backgroundColor: '#f59e0b' },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  b2bBadge: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  b2bText: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  subHeadline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginTop: 24,
    lineHeight: 22,
  },
  flatListContent: { alignItems: 'center' },
  slide: { width: width - 48, alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -45,
    zIndex: 10,
    shadowColor: '#16A085',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  glassCard: {
    width: '100%',
    padding: 24,
    paddingTop: 60,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  header: { fontSize: 24, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  description: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 18 },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  tagText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  ctaButton: {
    backgroundColor: '#16A085',
    marginTop: 24,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  ctaButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  bottomContainer: { marginTop: 'auto', paddingBottom: 10 },
  teaserRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.6)',
  },
  teaserItem: { alignItems: 'center' },
  teaserIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teaserLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginTop: 6 },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
  },
  navText: { color: '#64748b', fontWeight: '700', fontSize: 14, width: 40 },
  dotContainer: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#cbd5e1' },
  activeDot: { width: 24, backgroundColor: '#16A085' },
  actionLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 24,
  },
  linkText: { fontSize: 13, color: '#1e293b', fontWeight: '700' },
  skipText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  divider: { color: '#e2e8f0' },
  copyright: {
    textAlign: 'center',
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 16,
    letterSpacing: 1,
  },
});