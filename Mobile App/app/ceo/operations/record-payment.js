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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../../../config';
import { useRouter } from 'expo-router';

export default function RecordPayment() {
  const router = useRouter();
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
  const [showCustomMonthInput, setShowCustomMonthInput] = useState(false);
  
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
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/Login');
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
      router.replace('/Login');
    }
  };

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const streetData = await axios.get(`${API_BASE_URL}/api/street/all`, { headers });
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
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/customers/by-street/${streetId}`, { headers });
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
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch customer details
      const customerResponse = await axios.get(`${API_BASE_URL}/api/customers/${customerId}`, { headers });
      setSelectedCustomerDetails(customerResponse.data.customer);
      
      // Fetch payment summary
      const summaryResponse = await axios.get(`${API_BASE_URL}/api/payments/summary/${customerId}`, { headers });
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

  const handleMonthChange = (value) => {
    // Validate YYYY-MM format
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(value)) {
      Alert.alert('Invalid Format', 'Please use YYYY-MM format (e.g., 2024-12)');
      return;
    }

    const [year, month] = value.split('-').map(Number);
    if (month < 1 || month > 12) {
      Alert.alert('Invalid Month', 'Month must be between 01 and 12');
      return;
    }

    handleInputChange('month', value);
    setShowCustomMonthInput(false);
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
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
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
      
      const response = await axios.post(`${API_BASE_URL}/api/payments`, payload, { headers });
      
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
      
      Alert.alert('Success', message, [{ text: 'OK', onPress: () => router.back() }]);
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
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {options.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={48} color="#999" />
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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Loading form data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Record Payment</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Street *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowDropdown({ ...showDropdown, street: true })}
            >
              <Text style={formData.street ? styles.dropdownTextSelected : styles.dropdownText}>
                {formData.street ? streets.find(s => s._id === formData.street)?.streetName : 'Select Street'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Customer *</Text>
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
                <ActivityIndicator size="small" color="#2E8B57" />
              ) : (
                <>
                  <Text style={formData.customer ? styles.dropdownTextSelected : styles.dropdownText}>
                    {formData.customer 
                      ? formatCustomerDisplay(customers.find(c => c._id === formData.customer)) 
                      : 'Select Customer'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#999" />
                </>
              )}
            </TouchableOpacity>
            {!formData.street && (
              <Text style={styles.helperText}>Select a street first</Text>
            )}
          </View>

          {selectedCustomerDetails && (
            <View style={styles.customerCard}>
              <View style={styles.customerCardHeader}>
                <Ionicons name="person-circle-outline" size={24} color="#2E8B57" />
                <Text style={styles.customerCardTitle}>Customer Summary</Text>
              </View>
              
              {loadingHistory ? (
                <View style={styles.loadingSection}>
                  <ActivityIndicator size="small" color="#2E8B57" />
                  <Text style={styles.loadingText}>Loading payment history...</Text>
                </View>
              ) : (
                <View style={styles.customerCardBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>{selectedCustomerDetails.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>
                      {selectedCustomerDetails.customer_type === 'residential' 
                        ? selectedCustomerDetails.apartment_type?.name || 'N/A'
                        : selectedCustomerDetails.commercial_subtype?.name || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Monthly Fee:</Text>
                    <Text style={[styles.detailValue, styles.feeValue]}>
                      ₦{selectedCustomerDetails.base_fee?.toLocaleString() || '0'}
                    </Text>
                  </View>
                  
                  {customerPaymentHistory && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Outstanding:</Text>
                        <Text style={[styles.detailValue, { color: '#EF4444', fontWeight: '700' }]}>
                          ₦{customerPaymentHistory.total_outstanding?.toLocaleString() || '0'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Paid (All Time):</Text>
                        <Text style={[styles.detailValue, { color: '#10B981' }]}>
                          ₦{customerPaymentHistory.total_paid?.toLocaleString() || '0'}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Payment Month * (YYYY-MM)</Text>
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
                <Ionicons name="help-circle-outline" size={24} color="#2E8B57" />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>Enter any month (past, present, or future)</Text>
          </View>

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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Payment Amount (₦) *</Text>
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Payment Method *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowDropdown({ ...showDropdown, payment_method: true })}
            >
              <Text style={formData.payment_method ? styles.dropdownTextSelected : styles.dropdownText}>
                {formData.payment_method ? paymentMethodOptions.find(m => m.value === formData.payment_method)?.label : 'Select Method'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Payment Status *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowDropdown({ ...showDropdown, payment_status: true })}
            >
              <Text style={formData.payment_status ? styles.dropdownTextSelected : styles.dropdownText}>
                {formData.payment_status ? paymentStatusOptions.find(s => s.value === formData.payment_status)?.label : 'Select Status'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Agent Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.agent_notes}
              onChangeText={(text) => handleInputChange('agent_notes', text)}
              placeholder="Add any notes about this payment..."
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
            onPress={handleSubmit} 
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Record Payment</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSection: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E2937',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.6,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#94A3B8',
  },
  dropdownTextSelected: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  customerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  customerCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8B57',
    marginLeft: 8,
  },
  customerCardBody: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  feeValue: {
    fontWeight: '700',
    color: '#2E8B57',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  balanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  noRecordsText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  balanceBody: {
    padding: 16,
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
    borderTopColor: '#E2E8F0',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  submitButton: {
    backgroundColor: '#2E8B57',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1E293B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
});