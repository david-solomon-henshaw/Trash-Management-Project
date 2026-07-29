import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
// import { API_BASE_URL } from '../config';

const { width } = Dimensions.get('window');

export default function PaymentModal({ visible, onClose }) {
  const [streets, setStreets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [customerPaymentHistory, setCustomerPaymentHistory] = useState(null);
  const [selectedMonthBalance, setSelectedMonthBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agentId, setAgentId] = useState('');
  
  const [formData, setFormData] = useState({
    street: '',
    customer: '',
    amount: '',
    payment_status: 'paid',
    payment_method: 'cash',
    month: new Date().toISOString().slice(0, 7),
    agent_notes: '',
    is_full_payment: false,
    pickup_id: '',
  });
  
  const [showDropdown, setShowDropdown] = useState({
    street: false,
    customer: false,
    payment_status: false,
    payment_method: false,
  });

  useEffect(() => {
    if (visible) {
      checkAuth();
      fetchData();
    }
  }, [visible]);

  const resetForm = () => {
    setFormData({
      street: '',
      customer: '',
      amount: '',
      payment_status: 'paid',
      payment_method: 'cash',
      month: new Date().toISOString().slice(0, 7),
      agent_notes: '',
      is_full_payment: false,
      pickup_id: '',
    });
    setSelectedCustomerDetails(null);
    setCustomerPaymentHistory(null);
    setSelectedMonthBalance(null);
    setCustomers([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please login again');
        handleClose();
      } else {
        const decodedToken = jwtDecode(token);
        setAgentId(decodedToken.user.id);
        setFormData(prevFormData => ({
          ...prevFormData,
          agent_id: decodedToken.user.id,
        }));
      }
    } catch (error) {
      console.error('Auth check error:', error);
      Alert.alert('Error', 'Authentication failed');
      handleClose();
    }
  };

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
     

      const streetData = await apiClient.get(`/street/all`);
      setStreets(streetData.data.streets || []);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchCustomersByStreet = async (streetId) => {
    setLoadingCustomers(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
     
      const response = await apiClient.get(`/customers/by-street/${streetId}`);
      setCustomers(response.data.customers || []);
      
      if (response.data.customers.length === 0) {
        Alert.alert('No Customers', 'No customers found on this street');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to fetch customers for this street');
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchCustomerPaymentHistory = async (customerId) => {
    setLoadingHistory(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
     
      
      // Fetch customer details
      const customerResponse = await apiClient.get(`/customers/${customerId}`);
      setSelectedCustomerDetails(customerResponse.data.customer);
      
      // Fetch payment summary
      const summaryResponse = await apiClient.get(`/payments/summary/${customerId}`);
      setCustomerPaymentHistory(summaryResponse.data);
      
      // Calculate balance for the currently selected month
      calculateMonthBalance(summaryResponse.data, formData.month, customerResponse.data.customer.base_fee);
      
    } catch (error) {
      console.error('Error fetching customer payment history:', error);
      setCustomerPaymentHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const calculateMonthBalance = (paymentHistory, selectedMonth, baseFee) => {
    if (!paymentHistory || !paymentHistory.monthly_fees || paymentHistory.monthly_fees.length === 0) {
      // No payment records - use base fee
      setSelectedMonthBalance({
        total_fee: baseFee,
        paid_so_far: 0,
        remaining: baseFee,
        status: 'unpaid',
        has_records: false
      });
      setFormData(prev => ({ ...prev, amount: baseFee.toString() }));
      return;
    }

    // Check if selected month exists in records
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthEntry = paymentHistory.monthly_fees.find(fee => {
      const feeDate = new Date(fee.month);
      return feeDate.getUTCFullYear() === year && 
             feeDate.getUTCMonth() === month - 1;
    });

    if (monthEntry) {
      // Month has records - use actual data
      const paidSoFar = monthEntry.total_fee - monthEntry.remaining_balance;
      const remaining = Math.max(0, monthEntry.remaining_balance);
      
      setSelectedMonthBalance({
        total_fee: monthEntry.total_fee,
        paid_so_far: paidSoFar,
        remaining: remaining,
        status: remaining === 0 ? 'paid' : paidSoFar > 0 ? 'partial' : 'unpaid',
        has_records: true
      });
      
      setFormData(prev => ({ ...prev, amount: remaining > 0 ? remaining.toString() : '' }));
    } else {
      // Month not in records - use base fee
      setSelectedMonthBalance({
        total_fee: baseFee,
        paid_so_far: 0,
        remaining: baseFee,
        status: 'unpaid',
        has_records: false
      });
      setFormData(prev => ({ ...prev, amount: baseFee.toString() }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    if (field === 'street') {
      setFormData(prev => ({ ...prev, customer: '', amount: '' }));
      setSelectedCustomerDetails(null);
      setCustomerPaymentHistory(null);
      setSelectedMonthBalance(null);
      setCustomers([]);
      fetchCustomersByStreet(value);
    }
    
    if (field === 'customer') {
      setFormData(prev => ({ ...prev, amount: '' }));
      setSelectedMonthBalance(null);
      fetchCustomerPaymentHistory(value);
    }

    if (field === 'month' && selectedCustomerDetails) {
      calculateMonthBalance(
        customerPaymentHistory, 
        value, 
        selectedCustomerDetails.base_fee
      );
    }
  };

  const handleSubmit = async () => {
    if (!formData.street || !formData.customer || !formData.amount || !formData.month) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    // Check if overpaying
    if (selectedMonthBalance && amount > selectedMonthBalance.remaining) {
      Alert.alert(
        'Overpayment Warning',
        `Amount (₦${amount}) exceeds remaining balance (₦${selectedMonthBalance.remaining}). Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => submitPayment(amount) }
        ]
      );
      return;
    }

    await submitPayment(amount);
  };

  const submitPayment = async (amount) => {
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
     
      const payload = {
        customer_id: formData.customer,
        amount: amount,
        payment_status: formData.payment_status,
        payment_method: formData.payment_method,
        month: formData.month,
        agent_id: formData.agent_id,
        agent_notes: formData.agent_notes,
        is_full_payment: formData.is_full_payment,
        pickup_id: formData.pickup_id || undefined,
        allow_overpayment: true
      };
      
      const response = await apiClient.post(`/payments`, payload);
      
      const summary = response.data.payment_summary;
      const receipt = response.data.receipt;
      
      let message = `Payment recorded successfully!\n\nTotal Fee: ₦${summary?.total_fee || 0}\nTotal Paid: ₦${summary?.total_paid || 0}\nRemaining: ₦${summary?.remaining_balance || 0}`;
      
      if (receipt) {
        message += `\n\nReceipt: ${receipt.receipt_number}`;
        if (receipt.sent) {
          message += `\n✓ Email sent to ${receipt.email}`;
        } else if (receipt.email) {
          message += `\n⚠ Email failed (payment saved)`;
        } else {
          message += `\nℹ️ No email on file`;
        }
      }
      
      Alert.alert('Success', message, [
        { 
          text: 'OK', 
          onPress: () => {
            resetForm();
            onClose();
          }
        }
      ]);
    } catch (error) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCustomerDisplay = (customer) => {
    const houseNumber = customer.house_number ? ` - House #${customer.house_number}` : '';
    const type = customer.apartment_type?.name || customer.commercial_subtype?.name || '';
    const typeDisplay = type ? ` (${type})` : '';
    return `${customer.name}${houseNumber}${typeDisplay}`;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return '#10B981';
      case 'partial': return '#F59E0B';
      case 'unpaid': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'paid': return 'Fully Paid';
      case 'partial': return 'Partially Paid';
      case 'unpaid': return 'Unpaid';
      default: return 'Unknown';
    }
  };

  const DropdownModal = ({ visible, onClose, options, field, title, isSimpleValue = false }) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {options.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyStateText}>
                  {field === 'customer' ? 'No customers on this street' : 'No options available'}
                </Text>
              </View>
            ) : (
              options.map((option, index) => (
                <TouchableOpacity
                  key={isSimpleValue ? option.value : option._id}
                  style={styles.modalItem}
                  onPress={() => {
                    if (isSimpleValue) {
                      handleInputChange(field, option.value);
                    } else {
                      handleInputChange(field, option._id);
                    }
                    onClose();
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {isSimpleValue 
                      ? option.label 
                      : field === 'customer' 
                        ? formatCustomerDisplay(option)
                        : (option.streetName || option.name)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const paymentStatusOptions = [
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'unpaid', label: 'Unpaid' },
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'transfer', label: 'Transfer' },
  ];

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading payment form...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Record Payment</Text>
            <Text style={styles.headerSubtitle}>Collect customer payments</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="card" size={24} color="white" />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            {/* Street Selection */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="location" size={16} color="#64748b" />
                <Text style={styles.label}>Street</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowDropdown({ ...showDropdown, street: true })}
              >
                <Text style={formData.street ? styles.dropdownTextSelected : styles.dropdownText}>
                  {formData.street ? streets.find(s => s._id === formData.street)?.streetName : 'Select Street'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Customer Selection */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="person" size={16} color="#64748b" />
                <Text style={styles.label}>Customer</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={[styles.dropdown, !formData.street && styles.dropdownDisabled]}
                onPress={() => {
                  if (!formData.street) {
                    Alert.alert('Select Street First', 'Please select a street before choosing a customer');
                    return;
                  }
                  setShowDropdown({ ...showDropdown, customer: true });
                }}
                disabled={!formData.street}
              >
                {loadingCustomers ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#6366f1" />
                    <Text style={styles.loadingTextSmall}>Loading customers...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={formData.customer ? styles.dropdownTextSelected : styles.dropdownText}>
                      {formData.customer 
                        ? formatCustomerDisplay(customers.find(c => c._id === formData.customer)) 
                        : 'Select Customer'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                  </>
                )}
              </TouchableOpacity>
              {!formData.street && (
                <Text style={styles.helperText}>Select a street first</Text>
              )}
            </View>

            {/* Customer Summary Card */}
            {selectedCustomerDetails && (
              <View style={styles.customerCard}>
                <View style={styles.customerCardHeader}>
                  <View style={styles.customerAvatar}>
                    <Ionicons name="person-circle" size={32} color="#6366f1" />
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{selectedCustomerDetails.name}</Text>
                    <Text style={styles.customerType}>
                      {selectedCustomerDetails.customer_type === 'residential' 
                        ? selectedCustomerDetails.apartment_type?.name || 'Residential'
                        : selectedCustomerDetails.commercial_subtype?.name || 'Commercial'}
                    </Text>
                  </View>
                </View>
                
                {loadingHistory ? (
                  <View style={styles.loadingSection}>
                    <ActivityIndicator size="small" color="#6366f1" />
                    <Text style={styles.loadingTextSmall}>Loading payment history...</Text>
                  </View>
                ) : (
                  <View style={styles.customerCardBody}>
                    <View style={styles.metricsGrid}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Monthly Fee</Text>
                        <Text style={styles.metricValue}>
                          ₦{selectedCustomerDetails.base_fee?.toLocaleString() || '0'}
                        </Text>
                      </View>
                      {customerPaymentHistory && (
                        <>
                          <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Total Paid</Text>
                            <Text style={[styles.metricValue, { color: '#10b981' }]}>
                              ₦{customerPaymentHistory.total_paid?.toLocaleString() || '0'}
                            </Text>
                          </View>
                          <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Outstanding</Text>
                            <Text style={[styles.metricValue, { color: '#ef4444' }]}>
                              ₦{customerPaymentHistory.total_outstanding?.toLocaleString() || '0'}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Month Selection */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="calendar" size={16} color="#64748b" />
                <Text style={styles.label}>Payment Month</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <View style={styles.monthInputContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={formData.month}
                  onChangeText={(text) => handleInputChange('month', text)}
                  placeholder="2024-12"
                  maxLength={7}
                  editable={!!formData.customer}
                />
                <TouchableOpacity
                  style={styles.monthHelpButton}
                  onPress={() => {
                    Alert.alert(
                      'Month Format',
                      'Enter month in YYYY-MM format\n\nExamples:\n• 2024-01 (January 2024)\n• 2023-12 (December 2023)\n• 2025-06 (June 2025)\n\nYou can enter any past or future month.'
                    );
                  }}
                >
                  <Ionicons name="help-circle-outline" size={24} color="#6366f1" />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>Format: YYYY-MM (e.g., 2024-12)</Text>
            </View>

            {/* Month Balance Card */}
            {selectedMonthBalance && (
              <View style={[styles.balanceCard, { borderLeftColor: getStatusColor(selectedMonthBalance.status) }]}>
                <View style={styles.balanceHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.balanceTitle}>
                      {(() => {
                        const [year, month] = formData.month.split('-').map(Number);
                        const date = new Date(Date.UTC(year, month - 1, 1));
                        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
                      })()} Balance
                    </Text>
                    {!selectedMonthBalance.has_records && (
                      <Text style={styles.noRecordsText}>ℹ️ No payment records for this month</Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedMonthBalance.status) }]}>
                    <Text style={styles.statusBadgeText}>{getStatusLabel(selectedMonthBalance.status)}</Text>
                  </View>
                </View>
                <View style={styles.balanceBody}>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Monthly Fee:</Text>
                    <Text style={styles.balanceAmount}>₦{selectedMonthBalance.total_fee.toLocaleString()}</Text>
                  </View>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Paid So Far:</Text>
                    <Text style={[styles.balanceAmount, { color: '#10B981' }]}>
                      ₦{selectedMonthBalance.paid_so_far.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.balanceRow, styles.balanceRowHighlight]}>
                    <Text style={[styles.balanceLabel, { fontWeight: '700' }]}>Remaining:</Text>
                    <Text style={[styles.balanceAmount, { fontWeight: '700', fontSize: 18, color: '#EF4444' }]}>
                      ₦{selectedMonthBalance.remaining.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Payment Amount */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="cash" size={16} color="#64748b" />
                <Text style={styles.label}>Payment Amount (₦)</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={formData.amount}
                onChangeText={(text) => handleInputChange('amount', text)}
                placeholder="Enter amount"
              />
              {selectedMonthBalance && formData.amount && (
                <Text style={[
                  styles.helperText,
                  parseFloat(formData.amount) > selectedMonthBalance.remaining && { color: '#EF4444' }
                ]}>
                  {parseFloat(formData.amount) < selectedMonthBalance.remaining 
                    ? `Partial payment: ₦${(selectedMonthBalance.remaining - parseFloat(formData.amount)).toLocaleString()} will remain` 
                    : parseFloat(formData.amount) === selectedMonthBalance.remaining
                      ? '✓ Full payment for this month'
                      : `⚠ Overpayment by ₦${(parseFloat(formData.amount) - selectedMonthBalance.remaining).toLocaleString()}`}
                </Text>
              )}
            </View>

            {/* Payment Method and Status Row */}
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <View style={styles.labelContainer}>
                  <Ionicons name="card" size={16} color="#64748b" />
                  <Text style={styles.label}>Method</Text>
                </View>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowDropdown({ ...showDropdown, payment_method: true })}
                >
                  <Text style={formData.payment_method ? styles.dropdownTextSelected : styles.dropdownText}>
                    {formData.payment_method ? paymentMethodOptions.find(m => m.value === formData.payment_method)?.label : 'Select Method'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <View style={styles.labelContainer}>
                  <Ionicons name="flag" size={16} color="#64748b" />
                  <Text style={styles.label}>Status</Text>
                </View>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowDropdown({ ...showDropdown, payment_status: true })}
                >
                  <Text style={formData.payment_status ? styles.dropdownTextSelected : styles.dropdownText}>
                    {formData.payment_status ? paymentStatusOptions.find(s => s.value === formData.payment_status)?.label : 'Select Status'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Agent Notes */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="document-text" size={16} color="#64748b" />
                <Text style={styles.label}>Agent Notes</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.agent_notes}
                onChangeText={(text) => handleInputChange('agent_notes', text)}
                placeholder="Add any notes about this payment..."
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
              onPress={handleSubmit} 
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Record Payment</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modals */}
        <DropdownModal
          visible={showDropdown.street}
          onClose={() => setShowDropdown({ ...showDropdown, street: false })}
          options={streets}
          field="street"
          title="Select Street"
          isSimpleValue={false}
        />
        <DropdownModal
          visible={showDropdown.customer}
          onClose={() => setShowDropdown({ ...showDropdown, customer: false })}
          options={customers}
          field="customer"
          title="Select Customer"
          isSimpleValue={false}
        />
        <DropdownModal
          visible={showDropdown.payment_status}
          onClose={() => setShowDropdown({ ...showDropdown, payment_status: false })}
          options={paymentStatusOptions}
          field="payment_status"
          title="Select Payment Status"
          isSimpleValue={true}
        />
        <DropdownModal
          visible={showDropdown.payment_method}
          onClose={() => setShowDropdown({ ...showDropdown, payment_method: false })}
          options={paymentMethodOptions}
          field="payment_method"
          title="Select Payment Method"
          isSimpleValue={true}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerIcon: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  required: {
    color: '#ef4444',
    marginLeft: 2,
    fontSize: 14,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  monthInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthHelpButton: {
    padding: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dropdownDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.6,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#94a3b8',
  },
  dropdownTextSelected: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingTextSmall: {
    fontSize: 14,
    color: '#64748b',
  },
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  customerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerAvatar: {
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  customerType: {
    fontSize: 14,
    color: '#64748b',
  },
  customerCardBody: {
    // Additional styles if needed
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  noRecordsText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  balanceBody: {
    padding: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  balanceRowHighlight: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#f1f5f9',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
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
    fontWeight: '500',
  },
  loadingSection: {
    padding: 20,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1e293b',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
});