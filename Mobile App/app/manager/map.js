import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const TRUCK_ICON_URL = 'https://cdn3d.iconscout.com/3d/premium/thumb/garbage-truck-3d-icon-png-download-11009921.png';

const Map = () => {
  const [trucks, setTrucks] = useState([
    {
      id: '1',
      name: 'Truck 1',
      type: 'Garbage',
      status: 'active',
      capacity: '85%',
      driver: 'John Doe',
      coordinate: {
        latitude: 6.5244,
        longitude: 3.3792,
      },
      route: [
        { latitude: 6.5244, longitude: 3.3792 },
        { latitude: 6.5254, longitude: 3.3802 },
        { latitude: 6.5264, longitude: 3.3812 },
        { latitude: 6.5274, longitude: 3.3822 },
      ],
      routeProgress: 0,
      currentRouteIndex: 0,
      speed: '25 km/h',
      lastUpdate: '2 min ago',
    },
    {
      id: '2',
      name: 'Truck 2',
      type: 'Recycling',
      status: 'collecting',
      capacity: '60%',
      driver: 'Jane Smith',
      coordinate: {
        latitude: 6.5274,
        longitude: 3.3822,
      },
      route: [
        { latitude: 6.5274, longitude: 3.3822 },
        { latitude: 6.5284, longitude: 3.3832 },
        { latitude: 6.5294, longitude: 3.3842 },
        { latitude: 6.5304, longitude: 3.3852 },
      ],
      routeProgress: 0,
      currentRouteIndex: 0,
      speed: '18 km/h',
      lastUpdate: '1 min ago',
    },
    {
      id: '3',
      name: 'Truck 3',
      type: 'Hazardous',
      status: 'idle',
      capacity: '30%',
      driver: 'Mike Johnson',
      coordinate: {
        latitude: 6.5214,
        longitude: 3.3772,
      },
      route: [
        { latitude: 6.5214, longitude: 3.3772 },
        { latitude: 6.5224, longitude: 3.3782 },
        { latitude: 6.5234, longitude: 3.3792 },
      ],
      routeProgress: 0,
      currentRouteIndex: 0,
      speed: '0 km/h',
      lastUpdate: '5 min ago',
    },
  ]);

  const [selectedTruck, setSelectedTruck] = useState(null);
  const [showTruckList, setShowTruckList] = useState(false);
  const [mapType, setMapType] = useState('standard');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef(null);
  const animationRef = useRef();
  const lastTimestampRef = useRef(0);
  const progressRef = useRef(trucks.map(() => 0));

  const truckColors = {
    Garbage: '#10b981',
    Recycling: '#3b82f6',
    Hazardous: '#ef4444'
  };

  const statusColors = {
    active: '#10b981',
    collecting: '#f59e0b',
    idle: '#6b7280',
    maintenance: '#ef4444'
  };

  // Animate truck list slide
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showTruckList ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showTruckList]);

  // Smooth truck animation using requestAnimationFrame
  const animateTrucks = (timestamp) => {
    if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
    const deltaTime = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    setTrucks(prevTrucks =>
      prevTrucks.map((truck, index) => {
        const currentSegment = truck.currentRouteIndex;
        const nextSegment = (currentSegment + 1) % truck.route.length;
        let progress = progressRef.current[index] + (0.00005 * deltaTime);

        if (progress >= 1) {
          progress = 0;
          progressRef.current[index] = 0;
          return {
            ...truck,
            coordinate: truck.route[nextSegment],
            routeProgress: 0,
            currentRouteIndex: nextSegment,
            lastUpdate: 'Just now',
          };
        } else {
          progressRef.current[index] = progress;
          const start = truck.route[currentSegment];
          const end = truck.route[nextSegment];
          const newCoordinate = {
            latitude: start.latitude + (end.latitude - start.latitude) * progress,
            longitude: start.longitude + (end.longitude - start.longitude) * progress,
          };
          return { ...truck, coordinate: newCoordinate, routeProgress: progress };
        }
      })
    );
    animationRef.current = requestAnimationFrame(animateTrucks);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animateTrucks);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const handleTruckPress = (truck) => {
    setSelectedTruck(truck);
    mapRef.current.animateToRegion({
      ...truck.coordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  };

  const handleMapPress = () => {
    setSelectedTruck(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'play-circle';
      case 'collecting': return 'refresh-circle';
      case 'idle': return 'time-outline';
      case 'maintenance': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const TruckMarker = ({ truck }) => (
    <Marker coordinate={truck.coordinate} onPress={() => handleTruckPress(truck)}>
      <View style={styles.markerContainer}>
        <View style={[styles.markerPulse, { backgroundColor: `${truckColors[truck.type]}20` }]} />
        <View style={[styles.markerInner, { backgroundColor: truckColors[truck.type] }]}>
          <Image source={{ uri: TRUCK_ICON_URL }} style={styles.truckIcon} resizeMode="contain" />
          <View style={[styles.statusDot, { backgroundColor: statusColors[truck.status] }]} />
        </View>
      </View>
    </Marker>
  );

  const TruckInfoCard = ({ truck }) => (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <View style={styles.truckIdentity}>
          <View style={[styles.typeBadge, { backgroundColor: truckColors[truck.type] }]}>
            <Text style={styles.typeText}>{truck.type}</Text>
          </View>
          <Text style={styles.truckName}>{truck.name}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons name={getStatusIcon(truck.status)} size={16} color={statusColors[truck.status]} />
          <Text style={[styles.statusText, { color: statusColors[truck.status] }]}>
            {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
          </Text>
        </View>
      </View>
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Ionicons name="person" size={14} color="#64748b" />
          <Text style={styles.infoLabel}>{truck.driver}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="speedometer" size={14} color="#64748b" />
          <Text style={styles.infoLabel}>{truck.speed}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="cube" size={14} color="#64748b" />
          <Text style={styles.infoLabel}>{truck.capacity}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time" size={14} color="#64748b" />
          <Text style={styles.infoLabel}>{truck.lastUpdate}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedTruck(null)}>
        <Ionicons name="close" size={20} color="#64748b" />
      </TouchableOpacity>
    </View>
  );

  const TruckListItem = ({ truck }) => (
    <TouchableOpacity style={styles.truckListItem} onPress={() => handleTruckPress(truck)}>
      <View style={styles.listItemLeft}>
        <View style={[styles.listTypeIndicator, { backgroundColor: truckColors[truck.type] }]} />
        <View>
          <Text style={styles.listTruckName}>{truck.name}</Text>
          <Text style={styles.listTruckType}>{truck.type}</Text>
        </View>
      </View>
      <View style={styles.listItemRight}>
        <View style={styles.listStatus}>
          <Ionicons name={getStatusIcon(truck.status)} size={14} color={statusColors[truck.status]} />
          <Text style={[styles.listStatusText, { color: statusColors[truck.status] }]}>
            {truck.status}
          </Text>
        </View>
        <Text style={styles.listCapacity}>{truck.capacity}</Text>
      </View>
    </TouchableOpacity>
  );

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
          latitude: 6.5244,
          longitude: 3.3792,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {trucks.map(truck => (
          <TruckMarker key={truck.id} truck={truck} />
        ))}
      </MapView>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setShowTruckList(!showTruckList)}>
          <Ionicons name="list" size={24} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}>
          <Ionicons name={mapType === 'standard' ? "earth" : "earth-outline"} size={24} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => {
          mapRef.current.animateToRegion({
            latitude: 6.5244,
            longitude: 3.3792,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 500);
        }}>
          <Ionicons name="locate" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Selected Truck Info Card */}
      {selectedTruck && <TruckInfoCard truck={selectedTruck} />}

      {/* Truck List Slide-up Panel */}
      <Animated.View style={[
        styles.truckListPanel,
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
          <Text style={styles.panelTitle}>Active Trucks ({trucks.length})</Text>
          <TouchableOpacity style={styles.closePanelButton} onPress={() => setShowTruckList(false)}>
            <Ionicons name="chevron-down" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.truckList} showsVerticalScrollIndicator={false}>
          {trucks.map(truck => (
            <TruckListItem key={truck.id} truck={truck} />
          ))}
        </ScrollView>
      </Animated.View>

      {/* Quick Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{trucks.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {trucks.filter(t => t.status === 'active' || t.status === 'collecting').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {trucks.filter(t => parseFloat(t.capacity) > 80).length}
          </Text>
          <Text style={styles.statLabel}>Full</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  map: { flex: 1 },
  markerContainer: { alignItems: 'center', justifyContent: 'center' },
  markerPulse: { position: 'absolute', width: 50, height: 50, borderRadius: 25, opacity: 0.6 },
  markerInner: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  truckIcon: { width: 24, height: 24 },
  statusDot: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: 'white' },
  controlPanel: { position: 'absolute', top: 60, right: 16, backgroundColor: 'white', borderRadius: 16, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  controlButton: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginVertical: 4 },
  infoCard: { position: 'absolute', bottom: 120, left: 16, right: 16, backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  truckIdentity: { flexDirection: 'row', alignItems: 'center' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  typeText: { color: 'white', fontSize: 12, fontWeight: '600' },
  truckName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', width: '50%', paddingHorizontal: 8, marginBottom: 8 },
  infoLabel: { fontSize: 12, color: '#64748b', marginLeft: 6 },
  closeButton: { position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  truckListPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: 400, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  panelTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  closePanelButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  truckList: { maxHeight: 320, paddingHorizontal: 20 },
  truckListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  listTypeIndicator: { width: 4, height: 32, borderRadius: 2, marginRight: 12 },
  listTruckName: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  listTruckType: { fontSize: 12, color: '#64748b' },
  listItemRight: { alignItems: 'flex-end' },
  listStatus: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  listStatusText: { fontSize: 12, fontWeight: '500', marginLeft: 4 },
  listCapacity: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  statsBar: { position: 'absolute', top: 60, left: 16, right: 80, backgroundColor: 'white', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  statDivider: { width: 1, height: 24, backgroundColor: '#e2e8f0' },
});

export default Map;
