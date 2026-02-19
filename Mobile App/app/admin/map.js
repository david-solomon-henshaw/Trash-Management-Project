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
  ActivityIndicator
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { API_BASE_URL } from '../../config'; // Adjust path as needed

const { width, height } = Dimensions.get('window');

const Map = () => {
  const [activeRoutes, setActiveRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteList, setShowRouteList] = useState(false);
  const [mapType, setMapType] = useState('standard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef(null);
  const pollingRef = useRef(null);

  // Polling interval in milliseconds (2 minutes)
  const POLLING_INTERVAL = 2 * 60 * 1000;

  const statusColors = {
    'in_progress': '#10b981',
    'paused': '#f59e0b',
    'at_dumpsite': '#8b5cf6',
    'default': '#6b7280'
  };

  const statusIcons = {
    'in_progress': 'play-circle',
    'paused': 'pause-circle',
    'at_dumpsite': 'location',
    'default': 'help-circle'
  };

  // Fetch real route data from backend
  const fetchActiveRoutes = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        `${API_BASE_URL}/api/trucks/active-routes`, 
        { headers }
      );

      if (response.data.success) {
        // Filter routes that have current location data
        const routesWithLocation = response.data.routes.filter(route => 
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

  // Start polling for updates
  const startPolling = () => {
    fetchActiveRoutes(); // Initial fetch
    
    pollingRef.current = setInterval(() => {
      fetchActiveRoutes();
    }, POLLING_INTERVAL);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  // Animate route list slide
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
    mapRef.current.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  };

  const handleMapPress = () => {
    setSelectedRoute(null);
  };

  const handleManualRefresh = () => {
    fetchActiveRoutes();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleTimeString();
  };

  const RouteMarker = ({ route }) => {
    const location = route.assignment_lifecycle.current_location;
    const statusColor = statusColors[route.status] || statusColors.default;
    const statusIcon = statusIcons[route.status] || statusIcons.default;

    return (
      <Marker 
        coordinate={{
          latitude: location.latitude,
          longitude: location.longitude
        }} 
        onPress={() => handleRoutePress(route)}
      >
        <View style={styles.markerContainer}>
          <View style={[styles.markerPulse, { backgroundColor: `${statusColor}20` }]} />
          <View style={[styles.markerInner, { backgroundColor: statusColor }]}>
            <Ionicons name="car" size={20} color="white" />
            <View style={[styles.statusDot, { backgroundColor: 'white' }]} />
          </View>
        </View>
      </Marker>
    );
  };

  const RouteInfoCard = ({ route }) => {
    const location = route.assignment_lifecycle.current_location;
    const statusColor = statusColors[route.status] || statusColors.default;
    const statusIcon = statusIcons[route.status] || statusIcons.default;

    return (
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={styles.routeIdentity}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Ionicons name={statusIcon} size={12} color="white" />
              <Text style={styles.statusText}>
                {route.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.routeTitle}>{route.title}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedRoute(null)}>
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.routeDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={14} color="#64748b" />
            <Text style={styles.detailLabel}>Supervisor:</Text>
            <Text style={styles.detailValue}>{route.supervisor}</Text>
          </View>

          {route.truck && (
            <View style={styles.detailRow}>
              <Ionicons name="car" size={14} color="#64748b" />
              <Text style={styles.detailLabel}>Truck:</Text>
              <Text style={styles.detailValue}>
                {route.truck.plate_number} • {route.truck.truckModel}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="location" size={14} color="#64748b" />
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          </View>

          {location.accuracy && (
            <View style={styles.detailRow}>
              <Ionicons name="locate" size={14} color="#64748b" />
              <Text style={styles.detailLabel}>Accuracy:</Text>
              <Text style={styles.detailValue}>{location.accuracy}m</Text>
            </View>
          )}

          {location.speed && location.speed > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="speedometer" size={14} color="#64748b" />
              <Text style={styles.detailLabel}>Speed:</Text>
              <Text style={styles.detailValue}>{location.speed} km/h</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="time" size={14} color="#64748b" />
            <Text style={styles.detailLabel}>Last Update:</Text>
            <Text style={styles.detailValue}>{formatTime(location.timestamp)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="map" size={14} color="#64748b" />
            <Text style={styles.detailLabel}>Streets:</Text>
            <Text style={styles.detailValue}>{route.streets?.length || 0} assigned</Text>
          </View>
        </View>
      </View>
    );
  };

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
            <Ionicons name={statusIcon} size={14} color={statusColor} />
            <Text style={[styles.listStatusText, { color: statusColor }]}>
              {route.status.replace('_', ' ')}
            </Text>
          </View>
          <Text style={styles.listUpdateTime}>
            {formatTime(location.timestamp)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading live routes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        onPress={handleMapPress}
        initialRegion={{
          latitude: 6.5244, // Default Lagos coordinates
          longitude: 3.3792,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {activeRoutes.map(route => (
          <RouteMarker key={route.id} route={route} />
        ))}
      </MapView>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => setShowRouteList(!showRouteList)}
        >
          <Ionicons name="list" size={24} color="#374151" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
        >
          <Ionicons name={mapType === 'standard' ? "earth" : "earth-outline"} size={24} color="#374151" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleManualRefresh}
        >
          <Ionicons name="refresh" size={24} color="#374151" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => {
            if (activeRoutes.length > 0) {
              // Fit map to show all markers
              const coordinates = activeRoutes.map(route => 
                route.assignment_lifecycle.current_location
              );
              mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }
          }}
        >
          <Ionicons name="locate" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Selected Route Info Card */}
      {selectedRoute && <RouteInfoCard route={selectedRoute} />}

      {/* Route List Slide-up Panel */}
      <Animated.View style={[
        styles.routeListPanel,
        {
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [400, 0]
            })
          }]
        }
      ]}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>
            Active Routes ({activeRoutes.length})
          </Text>
          <TouchableOpacity 
            style={styles.closePanelButton} 
            onPress={() => setShowRouteList(false)}
          >
            <Ionicons name="chevron-down" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.routeList} showsVerticalScrollIndicator={false}>
          {activeRoutes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Active Routes</Text>
              <Text style={styles.emptyText}>
                There are currently no active routes with location data
              </Text>
            </View>
          ) : (
            activeRoutes.map(route => (
              <RouteListItem key={route.id} route={route} />
            ))
          )}
        </ScrollView>
      </Animated.View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{activeRoutes.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {activeRoutes.filter(r => r.status === 'in_progress').length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {activeRoutes.filter(r => r.status === 'at_dumpsite').length}
          </Text>
          <Text style={styles.statLabel}>At Dumpsite</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  map: { flex: 1 },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },

  // Marker Styles
  markerContainer: { alignItems: 'center', justifyContent: 'center' },
  markerPulse: { 
    position: 'absolute', 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    opacity: 0.6 
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
    elevation: 5 
  },
  statusDot: { 
    position: 'absolute', 
    top: 2, 
    right: 2, 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    borderWidth: 1, 
    borderColor: 'white' 
  },

  // Control Panel
  controlPanel: { 
    position: 'absolute', 
    top: 60, 
    right: 16, 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 8 
  },
  controlButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginVertical: 4 
  },

  // Info Card
  infoCard: { 
    position: 'absolute', 
    bottom: 120, 
    left: 16, 
    right: 16, 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 12, 
    elevation: 8 
  },
  infoHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  routeIdentity: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  statusBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8, 
    marginRight: 8 
  },
  statusText: { 
    color: 'white', 
    fontSize: 10, 
    fontWeight: '600',
    marginLeft: 4
  },
  routeTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },
  closeButton: { 
    position: 'absolute', 
    top: 0, 
    right: 0, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: '#f1f5f9', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  routeDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    minWidth: 70,
  },
  detailValue: {
    fontSize: 12,
    color: '#1e293b',
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
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 8 
  },
  panelHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  panelTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },
  closePanelButton: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#f1f5f9', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  routeList: { 
    maxHeight: 320, 
    paddingHorizontal: 20 
  },
  routeListItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  listItemLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  statusIndicator: { 
    width: 4, 
    height: 32, 
    borderRadius: 2, 
    marginRight: 12 
  },
  listItemContent: {
    flex: 1,
  },
  listRouteTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#1e293b', 
    marginBottom: 2 
  },
  listRouteSupervisor: { 
    fontSize: 12, 
    color: '#64748b',
    marginBottom: 2
  },
  listRouteLocation: { 
    fontSize: 11, 
    color: '#94a3b8' 
  },
  listItemRight: { 
    alignItems: 'flex-end' 
  },
  listStatus: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  listStatusText: { 
    fontSize: 12, 
    fontWeight: '500', 
    marginLeft: 4 
  },
  listUpdateTime: { 
    fontSize: 11, 
    color: '#64748b' 
  },

  // Stats Bar
  statsBar: { 
    position: 'absolute', 
    top: 60, 
    left: 16, 
    right: 80, 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 8 
  },
  statItem: { 
    flex: 1, 
    alignItems: 'center' 
  },
  statNumber: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: 2 
  },
  statLabel: { 
    fontSize: 12, 
    color: '#64748b', 
    fontWeight: '500' 
  },
  statDivider: { 
    width: 1, 
    height: 24, 
    backgroundColor: '#e2e8f0' 
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Map;