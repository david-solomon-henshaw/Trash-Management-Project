import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';

// Theme constants
const COLORS = {
  primary: '#16A085',
  secondary: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

export default function StreetsIndex() {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    // Auth check is handled by the layout, but we can keep it for safety
  }, []);

  const handleBackPress = () => {
    router.back();
  };

  const streetActions = [
    {
      id: 'add-street',
      title: 'Add Street',
      description: 'Register a new street location',
      icon: 'add-circle',
      color: COLORS.primary,
      route: '/admin/operations/add-street',
    },
    {
      id: 'view-streets',
      title: 'View Streets',
      description: 'Browse all registered streets',
      icon: 'list',
      color: COLORS.secondary,
      route: '/admin/operations/view-streets',
    },
  ];

  const handleCardPress = (route) => {
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              accessible
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.logoGradient}
              >
                <Ionicons name="map" size={18} color="white" />
              </LinearGradient>
              <Text style={styles.logoText}>CleanHaul</Text>
            </View>
            <View style={styles.userInfoRight}>
              {user?.companyName && (
                <Text style={styles.companyName}>{user.companyName}</Text>
              )}
              <Text style={styles.roleText}>
                {user?.role?.toUpperCase() || 'ADMIN'}
              </Text>
              <Text style={styles.staffName}>{user?.full_name || 'User'}</Text>
            </View>
          </View>
          <Text style={styles.headline}>Street Management</Text>
          <Text style={styles.subheadline}>
            Manage and organize street locations
          </Text>
        </View>

        {/* Quick Actions Cards */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="apps" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          {streetActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => handleCardPress(action.route)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <LinearGradient
                  colors={[action.color, `${action.color}80`]}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={action.icon} size={24} color="white" />
                </LinearGradient>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>{action.title}</Text>
                  <Text style={styles.cardDescription}>{action.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Street Operations</Text>
            <Text style={styles.infoText}>
              Use this section to manage all street-related operations. More features are coming soon!
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.tagline}>CLEAN • SMART • RELIABLE</Text>
          <Text style={styles.copyright}>
            © 2026 CleanHaul • B2B Waste Operations
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  blob: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.15,
  },
  blob1: {
    top: -150,
    left: -150,
    backgroundColor: COLORS.primary,
  },
  blob2: {
    bottom: -150,
    right: -150,
    backgroundColor: COLORS.secondary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'column',
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  logoGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginLeft: 10,
  },
  companyName: {
    fontSize: 11,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  staffName: {
    fontSize: 11,
    color: COLORS.gray[800],
    fontWeight: '600',
  },
  userInfoRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  headline: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[800],
    letterSpacing: -0.3,
    marginTop: 12,
  },
  subheadline: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray[700],
    marginLeft: 8,
  },
  actionCard: {
    marginBottom: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.gray[500],
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(22, 160, 133, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gray[400],
    letterSpacing: 2,
    marginBottom: 4,
  },
  copyright: {
    fontSize: 9,
    color: COLORS.gray[300],
  },
});