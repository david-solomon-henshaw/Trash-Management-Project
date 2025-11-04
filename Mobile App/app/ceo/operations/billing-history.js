// billing-history.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function CustomerBillingHistory() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [paymentDetailModalVisible, setPaymentDetailModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Real data from API
  const [customers, setCustomers] = useState([]);
  const [billingHistory, setBillingHistory] = useState({});

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};
  // Search customers API call
  const searchCustomers = async (query) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const url = `${API_BASE_URL}/api/billing/search?query=${encodeURIComponent(query)}`;
      console.log('searchCustomers API call:', { url, token, query });
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('searchCustomers response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('searchCustomers error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('searchCustomers response data:', data);
      if (data.success) {
        setCustomers(data.customers || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to search customers');
      }
    } catch (error) {
      console.error('Search customers error:', error);
      Alert.alert('Error', 'Failed to search customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get customer billing history API call
  const getCustomerBillingHistory = async (customerId) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/billing/customer/${customerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        Alert.alert('Error', data.message || 'Failed to load billing history');
        return null;
      }
    } catch (error) {
      console.error('Get billing history error:', error);
      Alert.alert('Error', 'Failed to load billing history. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get payment details API call
  const getPaymentDetails = async (paymentId) => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/billing/payment/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.payment;
      } else {
        Alert.alert('Error', data.message || 'Failed to load payment details');
        return null;
      }
    } catch (error) {
      console.error('Get payment details error:', error);
      Alert.alert('Error', 'Failed to load payment details. Please try again.');
      return null;
    }
  };

  // Load initial customers
  useEffect(() => {
    loadInitialCustomers();
  }, []);

  const loadInitialCustomers = async () => {
    await searchCustomers('');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      if (query.trim() === '') {
        searchCustomers('');
      } else {
        searchCustomers(query);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await searchCustomers(searchQuery);
    setRefreshing(false);
  };

  const handleViewCustomer = async (customer) => {
    try {
      setSelectedCustomer(customer);
      setCustomerModalVisible(true);
      
      // Load billing history for this customer
      const history = await getCustomerBillingHistory(customer._id);
      
      if (history) {
        setSelectedCustomer(history.customer);
        setBillingHistory(prev => ({
          ...prev,
          [customer._id]: history.payments || []
        }));
      }
    } catch (error) {
      console.error('Error loading customer history:', error);
    }
  };

  const handleViewPaymentDetails = async (payment) => {
    try {
      setSelectedPayment(payment);
      setPaymentDetailModalVisible(true);
      
      // Load full payment details
      const paymentDetails = await getPaymentDetails(payment._id);
      
      if (paymentDetails) {
        setSelectedPayment(paymentDetails);
      }
    } catch (error) {
      console.error('Error loading payment details:', error);
    }
  };

  const calculateCustomerStats = (customerId) => {
    const payments = billingHistory[customerId] || [];
    const totalPaid = payments
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = payments.length;
    const lastPayment = payments[0]; // Assuming sorted by date
    
    return {
      totalPaid,
      totalPayments,
      lastPaymentDate: lastPayment ? formatDate(lastPayment.payment_date) : 'No payments',
      averagePayment: totalPayments > 0 ? totalPaid / totalPayments : 0
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonth = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'unpaid': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'paid': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'unpaid': return 'close-circle';
      default: return 'help-circle';
    }
  };

  // Filter customers based on search (now handled by API, but keeping for client-side fallback)
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Customer Billing</Text>
            <Text style={styles.headerSubtitle}>Search and view payment history</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer name, phone, or address..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E8B57']} />
        }
      >
        {/* Loading Indicator */}
        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E8B57" />
            <Text style={styles.loadingText}>Loading customers...</Text>
          </View>
        )}

        {/* Customers List */}
        <View style={styles.customersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? 'Search Results' : 'All Customers'}
            </Text>
            <Text style={styles.sectionCount}>
              {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
            </Text>
          </View>

          {!loading && filteredCustomers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No customers found' : 'No customers available'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try adjusting your search terms' : 'Customers will appear here once added'}
              </Text>
            </View>
          ) : (
            !loading && filteredCustomers.map((customer) => {
              const stats = calculateCustomerStats(customer._id);
              const customerPayments = billingHistory[customer._id] || [];
              
              return (
                <TouchableOpacity
                  key={customer._id}
                  style={styles.customerCard}
                  onPress={() => handleViewCustomer(customer)}
                >
                  <View style={styles.customerHeader}>
                    <View style={styles.customerIcon}>
                      <Ionicons 
                        name={customer.customer_type === 'residential' ? 'home' : 'business'} 
                        size={24} 
                        color="#2E8B57" 
                      />
                    </View>
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerName}>{customer.name}</Text>
                      <View style={styles.customerDetails}>
                        <Ionicons name="call-outline" size={14} color="#64748B" />
                        <Text style={styles.customerPhone}>{customer.phone}</Text>
                      </View>
                      <View style={styles.customerDetails}>
                        <Ionicons name="location-outline" size={14} color="#64748B" />
                        <Text style={styles.customerAddress}>
                          {customer.house_number}, {customer.street?.streetName}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Quick Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>₦{stats.totalPaid.toLocaleString()}</Text>
                      <Text style={styles.statLabel}>Total Paid</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats.totalPayments}</Text>
                      <Text style={styles.statLabel}>Payments</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats.lastPaymentDate}</Text>
                      <Text style={styles.statLabel}>Last Payment</Text>
                    </View>
                  </View>

                  <View style={styles.viewHistoryButton}>
                    <Text style={styles.viewHistoryText}>View Payment History</Text>
                    <Ionicons name="chevron-forward" size={16} color="#2E8B57" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Customer Details Modal */}
      <Modal
        visible={customerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedCustomer && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Payment History</Text>
                    <Text style={styles.modalSubtitle}>{selectedCustomer.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setCustomerModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                  {/* Customer Summary */}
                  <View style={styles.customerSummary}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Monthly Fee</Text>
                        <Text style={styles.summaryValue}>₦{selectedCustomer.base_fee?.toLocaleString()}</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Customer Type</Text>
                        <Text style={styles.summaryValue}>
                          {selectedCustomer.customer_type === 'residential' 
                            ? selectedCustomer.apartment_type?.name 
                            : selectedCustomer.commercial_subtype?.name}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Phone</Text>
                        <Text style={styles.summaryValue}>{selectedCustomer.phone}</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Address</Text>
                        <Text style={styles.summaryValue}>{selectedCustomer.address}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Payment History */}
                  <View style={styles.paymentHistorySection}>
                    <Text style={styles.sectionTitle}>Payment Records</Text>
                    
                    {(billingHistory[selectedCustomer._id] || []).length === 0 ? (
                      <View style={styles.noPayments}>
                        <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
                        <Text style={styles.noPaymentsText}>No payment records found</Text>
                        <Text style={styles.noPaymentsSubtext}>
                          This customer hasn't made any payments yet
                        </Text>
                      </View>
                    ) : (
                      billingHistory[selectedCustomer._id].map((payment) => (
                        <TouchableOpacity
                          key={payment._id}
                          style={styles.paymentItem}
                          onPress={() => handleViewPaymentDetails(payment)}
                        >
                          <View style={styles.paymentItemHeader}>
                            <View>
                              <Text style={styles.paymentMonth}>
                                {formatMonth(payment.month)}
                              </Text>
                              <Text style={styles.paymentDate}>
                                Paid on {formatDate(payment.payment_date)}
                              </Text>
                            </View>
                            <View style={styles.paymentAmountContainer}>
                              <Text style={styles.paymentAmount}>
                                ₦{payment.amount.toLocaleString()}
                              </Text>
                              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.payment_status) + '20' }]}>
                                <Ionicons 
                                  name={getStatusIcon(payment.payment_status)} 
                                  size={12} 
                                  color={getStatusColor(payment.payment_status)} 
                                />
                                <Text style={[styles.statusText, { color: getStatusColor(payment.payment_status) }]}>
                                  {payment.payment_status.toUpperCase()}
                                </Text>
                              </View>
                            </View>
                          </View>
                          
                          <View style={styles.paymentItemFooter}>
                            <View style={styles.methodBadge}>
                              <Ionicons 
                                name={payment.payment_method === 'cash' ? 'cash' : 'card'} 
                                size={12} 
                                color="#64748B" 
                              />
                              <Text style={styles.methodText}>
                                {payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}
                              </Text>
                            </View>
                            <Text style={styles.receiptText}>{payment.receipt_number}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setCustomerModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment Detail Modal */}
      <Modal
        visible={paymentDetailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedPayment && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Payment Details</Text>
                    <Text style={styles.modalSubtitle}>{selectedPayment.receipt_number}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setPaymentDetailModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Payment Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount:</Text>
                      <Text style={[styles.detailValue, styles.amountHighlight]}>
                        ₦{selectedPayment.amount.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status:</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPayment.payment_status) + '20' }]}>
                        <Ionicons name={getStatusIcon(selectedPayment.payment_status)} size={14} color={getStatusColor(selectedPayment.payment_status)} />
                        <Text style={[styles.statusText, { color: getStatusColor(selectedPayment.payment_status) }]}>
                          {selectedPayment.payment_status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Method:</Text>
                      <Text style={styles.detailValue}>
                        {selectedPayment.payment_method.charAt(0).toUpperCase() + selectedPayment.payment_method.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Billing Month:</Text>
                      <Text style={styles.detailValue}>{formatMonth(selectedPayment.month)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Payment Date:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedPayment.payment_date)}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Collection Details</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Collected By:</Text>
                      <Text style={styles.detailValue}>
                        {selectedPayment.agent_id?.full_name} ({selectedPayment.agent_id?.role})
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Verification:</Text>
                      {selectedPayment.verified ? (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                          <Text style={styles.verifiedText}>
                            Verified by {selectedPayment.verified_by?.full_name}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.pendingBadge}>
                          <Ionicons name="time" size={14} color="#F59E0B" />
                          <Text style={styles.pendingText}>Pending Verification</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {selectedPayment.agent_notes && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Agent Notes</Text>
                      <Text style={styles.notesText}>{selectedPayment.agent_notes}</Text>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setPaymentDetailModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#2E8B57',
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1E293B',
  },
  content: {
    flex: 1,
  },
  customersSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionCount: {
    fontSize: 14,
    color: '#64748B',
  },
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  customerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  customerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  customerPhone: {
    fontSize: 13,
    color: '#64748B',
  },
  customerAddress: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    gap: 4,
  },
  viewHistoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E8B57',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    maxHeight: '70%',
  },
  modalFooter: {
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  customerSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  paymentHistorySection: {
    marginBottom: 20,
  },
  paymentItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  paymentMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: '#64748B',
  },
  paymentAmountContainer: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E8B57',
    marginBottom: 4,
  },
  paymentItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  methodText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  receiptText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noPayments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noPaymentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 4,
  },
  noPaymentsSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  amountHighlight: {
    fontWeight: '700',
    color: '#2E8B57',
    fontSize: 16,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pendingText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
  },
  closeButton: {
    backgroundColor: '#2E8B57',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
    loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
});