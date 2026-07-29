import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import appClient from '../../hooks/services/client';

const { width, height } = Dimensions.get('window');

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

const Map = () => {
  const insets = useSafeAreaInsets();
  const [activeRoutes, setActiveRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteList, setShowRouteList] = useState(false);
  const [mapType, setMapType] = useState('standard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef(null);
  const pollingRef = useRef(null);

  const POLLING_INTERVAL = 2 * 60 * 1000;

  const statusColors = {
    in_progress: COLORS.success,
    paused: COLORS.warning,
    at_dumpsite: COLORS.purple,
    default: COLORS.gray[500],
  };

  const statusIcons = {
    in_progress: 'play-circle',
    paused: 'pause-circle',
    at_dumpsite: 'trash',
    default: 'help-circle',
  };

  const fetchActiveRoutes = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await appClient.get('/trucks/active-routes');

      if (response.data.success) {
        const routesWithLocation = response.data.routes.filter(
          (route) =>
            route.assignment_lifecycle?.current_location &&
            route.assignment_lifecycle.current_location.latitude &&
            route.assignment_lifecycle.current_location.longitude
        );
        setActiveRoutes(routesWithLocation);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to fetch routes');
      }
    } catch (error) {
      console.error('Fetch active routes error:', error);
      Alert.alert('Error', 'Failed to load route data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const startPolling = () => {
    fetchActiveRoutes();
    pollingRef.current = setInterval(fetchActiveRoutes, POLLING_INTERVAL);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    startPolling();
    return stopPolling;
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showRouteList ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showRouteList]);

  const handleRoutePress = (route) => {
    setSelectedRoute(route);
    const location = route.assignment_lifecycle.current_location;
    mapRef.current?.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
  };

  const handleMapPress = () => setSelectedRoute(null);

  const handleManualRefresh = () => fetchActiveRoutes();

  const formatTime = (timestamp) =>
    timestamp ? new Date(timestamp).toLocaleTimeString() : 'Unknown';

  const RouteMarker = ({ route }) => {
    const location = route.assignment_lifecycle.current_location;
    const statusColor = statusColors[route.status] || statusColors.default;
    const statusIcon = statusIcons[route.status] || statusIcons.default;

    return (
      <Marker
        coordinate={{
          latitude: location.latitude,
          longitude: location.longitude,
        }}
        onPress={() => handleRoutePress(route)}
      >
        <View style={styles.markerContainer}>
          <View
            style={[
              styles.markerPulse,
              { backgroundColor: `${statusColor}20` },
            ]}
          />
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.markerInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="car" size={20} color="white" />
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColor, borderColor: 'white' },
              ]}
            />
          </LinearGradient>
        </View>
      </Marker>
    );
  };

  const RouteInfoCard = ({ route }) => {
    const location = route.assignment_lifecycle.current_location;
    const statusColor = statusColors[route.status] || statusColors.default;
    const statusIcon = statusIcons[route.status] || statusIcons.default;

    return (
      <View style={[styles.infoCard, { bottom: insets.bottom + 120 }]}>
        <View style={styles.infoHeader}>
          <View style={styles.routeIdentity}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${statusColor}15` },
              ]}
            >
              <Ionicons name={statusIcon} size={12} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {route.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.routeTitle}>{route.title}</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedRoute(null)}
          >
            <Ionicons name="close" size={20} color={COLORS.gray[500]} />
          </TouchableOpacity>
        </View>

        <View style={styles.routeDetails}>
          <DetailRow icon="person" label="Supervisor" value={route.supervisor} />
          {route.truck && (
            <DetailRow
              icon="car"
              label="Truck"
              value={`${route.truck.plate_number} • ${route.truck.truckModel}`}
            />
          )}
          <DetailRow
            icon="location"
            label="Location"
            value={`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
          />
          {location.accuracy && (
            <DetailRow icon="locate" label="Accuracy" value={`${location.accuracy}m`} />
          )}
          {location.speed > 0 && (
            <DetailRow icon="speedometer" label="Speed" value={`${location.speed} km/h`} />
          )}
          <DetailRow icon="time" label="Last Update" value={formatTime(location.timestamp)} />
          <DetailRow
            icon="map"
            label="Streets"
            value={`${route.streets?.length || 0} assigned`}
          />
        </View>
      </View>
    );
  };

  const DetailRow = ({ icon, label, value }) => (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={14} color={COLORS.gray[500]} />
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );

  const RouteListItem = ({ route }) => {
    const location = route.assignment_lifecycle.current_location;
    const statusColor = statusColors[route.status] || statusColors.default;
    const statusIcon = statusIcons[route.status] || statusIcons.default;

    return (
      <TouchableOpacity
        style={styles.routeListItem}
        onPress={() => handleRoutePress(route)}
      >
        <View style={styles.listItemLeft}>
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          <View style={styles.listItemContent}>
            <Text style={styles.listRouteTitle}>{route.title}</Text>
            <Text style={styles.listRouteSupervisor}>{route.supervisor}</Text>
            <Text style={styles.listRouteLocation}>
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          </View>
        </View>
        <View style={styles.listItemRight}>
          <View style={styles.listStatus}>
            <Ionicons name={statusIcon} size={12} color={statusColor} />
            <Text style={[styles.listStatusText, { color: statusColor }]}>
              {route.status.replace('_', ' ')}
            </Text>
          </View>
          <Text style={styles.listUpdateTime}>{formatTime(location.timestamp)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading live routes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        onPress={handleMapPress}
        initialRegion={{
          latitude: 6.5244,
          longitude: 3.3792,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {activeRoutes.map((route) => (
          <RouteMarker key={route.id} route={route} />
        ))}
      </MapView>

      {/* Full‑screen empty state overlay when no routes */}
      {activeRoutes.length === 0 && (
        <View style={styles.emptyOverlay}>
          <View style={styles.emptyOverlayContent}>
            <Ionicons name="car-outline" size={64} color={COLORS.gray[400]} />
            <Text style={styles.emptyOverlayTitle}>No Active Routes</Text>
            <Text style={styles.emptyOverlayText}>
              There are currently no active routes with location data.
            </Text>
            <TouchableOpacity
              style={styles.emptyOverlayButton}
              onPress={handleManualRefresh}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.emptyOverlayButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Control Panel - positioned with top inset */}
      <View style={[styles.controlPanel, { top: insets.top + 16 }]}>
        <ControlButton icon="list" onPress={() => setShowRouteList(!showRouteList)} />
        <ControlButton
          icon={mapType === 'standard' ? 'earth' : 'earth-outline'}
          onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
        />
        <ControlButton icon="refresh" onPress={handleManualRefresh} />
        <ControlButton
          icon="locate"
          onPress={() => {
            if (activeRoutes.length > 0) {
              const coordinates = activeRoutes.map(
                (r) => r.assignment_lifecycle.current_location
              );
              mapRef.current?.fitToCoordinates(coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }
          }}
        />
      </View>

      {/* Stats Bar - positioned with top inset */}
      <View style={[styles.statsBar, { top: insets.top + 16, left: 16, right: 100 }]}>
        <StatItem
          number={activeRoutes.length}
          label="Total"
          color={COLORS.primary}
        />
        <StatDivider />
        <StatItem
          number={activeRoutes.filter((r) => r.status === 'in_progress').length}
          label="In Progress"
          color={COLORS.success}
        />
        <StatDivider />
        <StatItem
          number={activeRoutes.filter((r) => r.status === 'at_dumpsite').length}
          label="At Dumpsite"
          color={COLORS.purple}
        />
      </View>

      {/* Selected Route Info Card - positioned with bottom inset */}
      {selectedRoute && <RouteInfoCard route={selectedRoute} />}

      {/* Route List Slide-up Panel - positioned at bottom */}
      <Animated.View
        style={[
          styles.routeListPanel,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [400, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Active Routes ({activeRoutes.length})</Text>
          <TouchableOpacity
            style={styles.closePanelButton}
            onPress={() => setShowRouteList(false)}
          >
            <Ionicons name="chevron-down" size={24} color={COLORS.gray[500]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.routeList} showsVerticalScrollIndicator={false}>
          {activeRoutes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color={COLORS.gray[300]} />
              <Text style={styles.emptyTitle}>No Active Routes</Text>
              <Text style={styles.emptyText}>
                There are currently no active routes with location data
              </Text>
            </View>
          ) : (
            activeRoutes.map((route) => <RouteListItem key={route.id} route={route} />)
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const ControlButton = ({ icon, onPress }) => (
  <TouchableOpacity style={styles.controlButton} onPress={onPress}>
    <Ionicons name={icon} size={24} color={COLORS.primary} />
  </TouchableOpacity>
);

const StatItem = ({ number, label, color }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statNumber, { color }]}>{number}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const StatDivider = () => <View style={styles.statDivider} />;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  map: { flex: 1 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray[500],
  },

  // Marker
  markerContainer: { alignItems: 'center', justifyContent: 'center' },
  markerPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.6,
  },
  markerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statusDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },

  // Control Panel
  controlPanel: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },

  // Info Card
  infoCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  routeIdentity: { flex: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[800],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeDetails: { gap: 12 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontWeight: '500',
    minWidth: 70,
  },
  detailValue: {
    fontSize: 12,
    color: COLORS.gray[800],
    fontWeight: '500',
    flex: 1,
  },

  // Route List Panel
  routeListPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[800],
  },
  closePanelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeList: { maxHeight: 320, paddingHorizontal: 20 },
  routeListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  listItemContent: { flex: 1 },
  listRouteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 2,
  },
  listRouteSupervisor: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 2,
  },
  listRouteLocation: {
    fontSize: 11,
    color: COLORS.gray[400],
  },
  listItemRight: { alignItems: 'flex-end' },
  listStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  listStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  listUpdateTime: {
    fontSize: 11,
    color: COLORS.gray[500],
  },

  // Stats Bar
  statsBar: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.gray[200],
  },

  // Empty State (inside panel)
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },

  // New Full‑screen Empty Overlay
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  emptyOverlayContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyOverlayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyOverlayText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyOverlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyOverlayButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Map;