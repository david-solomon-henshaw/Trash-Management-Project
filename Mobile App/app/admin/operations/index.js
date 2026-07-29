import React from 'react';
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
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';

// Theme constants
const COLORS = {
  primary: '#16A085',
  secondary: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  brown: '#8B4513',
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

export default function OperationsIndex() {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);

  const operationsActions = [
    {
      id: 'staffs',
      title: 'Staff Management',
      description: 'Manage staff accounts and roles',
      icon: 'people',
      color: COLORS.primary,
      route: '/admin/operations/staffs',
    },
    {
      id: 'fleet',
      title: 'Fleet Management',
      description: 'Manage trucks, routes, and assignments',
      icon: 'car',
      color: COLORS.secondary,
      route: '/admin/operations/fleet',
    },
    {
      id: 'apartment-types',
      title: 'Residential Apartment Types',
      description: 'Manage apartment types and base fees',
      icon: 'home',
      color: COLORS.success,
      route: '/admin/operations/apartment-types',
    },
    {
      id: 'commercial-subtypes',
      title: 'Commercial Subtypes',
      description: 'Manage commercial subtypes and base fees',
      icon: 'business',
      color: COLORS.purple,
      route: '/admin/operations/commercial-subtypes',
    },
    {
      id: 'institutional-subtypes',
      title: 'Institutional Subtypes',
      description: 'Manage institutional subtypes and base fees',
      icon: 'school',
      color: COLORS.brown,
      route: '/admin/operations/institutional-subtypes',
    },
    {
      id: 'streets',
      title: 'Street Management',
      description: 'Manage streets and locations',
      icon: 'location',
      color: COLORS.danger,
      route: '/admin/operations/streets',
    },
    {
      id: 'customer',
      title: 'Customer Management',
      description: 'Manage and organize customer accounts',
      icon: 'person',
      color: COLORS.pink,
      route: '/admin/operations/customer',
    },
    {
      id: 'service-hub',
      title: 'Service Hub',
      description: 'Manage services, pricing, and categories',
      icon: 'construct',
      color: COLORS.cyan,
      route: '/admin/operations/service-hub',
    },
  ];

  const handleCardPress = (route) => {
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background blobs (optional) */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - matches index.js style */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoRow}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.logoGradient}
              >
                <Ionicons name="construct" size={18} color="white" />
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
          <Text style={styles.headline}>Operations Hub</Text>
          <Text style={styles.subheadline}>
            Centralized management for all operations
          </Text>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="apps" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Select a module to manage
          </Text>

          <View style={styles.gridContainer}>
            {operationsActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.tileCard}
                onPress={() => handleCardPress(action.route)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[action.color, `${action.color}80`]}
                  style={styles.tileIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={action.icon} size={24} color="white" />
                </LinearGradient>
                <View style={styles.tileTextContainer}>
                  <Text style={styles.tileTitle}>{action.title}</Text>
                  <Text style={styles.tileDescription} numberOfLines={2}>
                    {action.description}
                  </Text>
                </View>
                <View style={styles.tileArrow}>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={COLORS.gray[400]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="bulb" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Operations Center</Text>
            <Text style={styles.infoText}>
              Manage all operational aspects of Clean Haul from this centralized
              hub. Changes sync in real-time across the platform.
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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 20,
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
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray[700],
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginBottom: 16,
    marginLeft: 28,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tileCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 16,
    width: '48%',
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tileTextContainer: {
    marginBottom: 8,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  tileDescription: {
    fontSize: 12,
    color: COLORS.gray[500],
    lineHeight: 16,
  },
  tileArrow: {
    alignSelf: 'flex-end',
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