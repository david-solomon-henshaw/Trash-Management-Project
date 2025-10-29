import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const TRUCK_ICON_URL = 'https://cdn3d.iconscout.com/3d/premium/thumb/garbage-truck-3d-icon-png-download-11009921.png';

const Map = () => {
  const [trucks, setTrucks] = useState([
    {
      id: '1',
      name: 'Truck 1',
      type: 'Garbage',
      coordinate: {
        latitude: 6.5244,
        longitude: 3.3792,
      },
      route: [
        { latitude: 6.5244, longitude: 3.3792 },
        { latitude: 6.5254, longitude: 3.3802 },
        { latitude: 6.5264, longitude: 3.3812 },
      ],
      routeProgress: 0, // Progress along the route (0 to 1)
      currentRouteIndex: 0, // Current segment of the route
    },
    {
      id: '2',
      name: 'Truck 2',
      type: 'Recycling',
      coordinate: {
        latitude: 6.5274,
        longitude: 3.3822,
      },
      route: [
        { latitude: 6.5274, longitude: 3.3822 },
        { latitude: 6.5284, longitude: 3.3832 },
        { latitude: 6.5294, longitude: 3.3842 },
      ],
      routeProgress: 0,
      currentRouteIndex: 0,
    },
  ]);

  const mapRef = useRef(null);

  // Function to interpolate between two coordinates
  const interpolate = (start, end, progress) => ({
    latitude: start.latitude + (end.latitude - start.latitude) * progress,
    longitude: start.longitude + (end.longitude - start.longitude) * progress,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTrucks(prevTrucks =>
        prevTrucks.map(truck => {
          const currentSegment = truck.currentRouteIndex;
          const nextSegment = (currentSegment + 1) % truck.route.length;
          const progress = truck.routeProgress + 0.01; // Increment progress

          if (progress >= 1) {
            // Move to the next segment
            return {
              ...truck,
              coordinate: truck.route[nextSegment],
              routeProgress: 0,
              currentRouteIndex: nextSegment,
            };
          } else {
            // Interpolate between current and next segment
            const start = truck.route[currentSegment];
            const end = truck.route[nextSegment];
            const newCoordinate = interpolate(start, end, progress);

            return {
              ...truck,
              coordinate: newCoordinate,
              routeProgress: progress,
            };
          }
        })
      );
    }, 100); // Update every 100ms for smooth movement

    return () => clearInterval(interval);
  }, []);

  const handleTruckPress = truck => {
    Alert.alert(
      `Truck: ${truck.name}`,
      `Type: ${truck.type}\nLocation: ${truck.coordinate.latitude}, ${truck.coordinate.longitude}`
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 6.5244,
          longitude: 3.3792,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {trucks.map(truck => (
          <Marker
            key={truck.id}
            coordinate={truck.coordinate}
            title={truck.name}
            description={`Type: ${truck.type}`}
            onPress={() => handleTruckPress(truck)}
          >
            <Image
              source={{ uri: TRUCK_ICON_URL }}
              style={{ width: 30, height: 30 }}
              resizeMode="contain"
            />
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default Map;
