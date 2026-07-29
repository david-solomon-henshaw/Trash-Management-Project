import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#16A085',
  secondary: '#f59e0b',
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

const TrialModal = ({ visible, onClose, onSubscribe }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.iconGradient}
            >
              <Ionicons name="alert-circle" size={40} color="white" />
            </LinearGradient>
          </View>
          <Text style={styles.modalTitle}>Trial Mode</Text>
          <Text style={styles.modalMessage}>
            Your account is currently on a trial. To add staff members, please subscribe to a plan.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.subscribeButton]}
              onPress={() => {
                onSubscribe?.();
                onClose();
              }}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.subscribeButtonText}>Subscribe</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.gray[600],
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TrialModal;