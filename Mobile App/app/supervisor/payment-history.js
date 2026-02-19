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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// import { API_BASE_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');

export default function PaymentHistory() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [paymentDetailModalVisible, setPaymentDetailModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  const [customers, setCustomers] = useState([]);
  const [billingHistory, setBillingHistory] = useState({});
  const [paymentDetails, setPaymentDetails] = useState({});

  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const searchCustomers = async (query) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const url = `${API_BASE_URL}/api/billing/search?query=${encodeURIComponent(query)}`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      const data = response.data;
      if (data.success) {
        setCustomers(data.customers || []);
        prefetchBillingForCustomers(data.customers || []);
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

  const prefetchBillingForCustomers = async (customerList) => {
    if (!Array.isArray(customerList) || customerList.length === 0) return;
    for (const c of customerList) {
      prefetchCustomerBillingHistory(c._id);
    }
  };

  const prefetchCustomerBillingHistory = async (customerId) => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/api/billing/customer/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = response.data;
      if (data.success) {
        const payments = data.data.payments || [];
        setBillingHistory(prev => ({ ...prev, [customerId]: payments }));
        payments.forEach(p => prefetchPaymentDetails(p._id));
      }
    } catch (err) {
      console.error('Prefetch customer billing error:', err);
    }
  };

  const prefetchPaymentDetails = async (paymentId) => {
    try {
      if (paymentDetails[paymentId]) return;
      const token = await getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/api/billing/payment/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = response.data;
      if (data.success) {
        setPaymentDetails(prev => ({ ...prev, [paymentId]: data.payment }));
      }
    } catch (err) {
      console.error('Prefetch payment details error:', err);
    }
  };

  useEffect(() => {
    loadInitialCustomers();
  }, []);

  const loadInitialCustomers = async () => {
    await searchCustomers('');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
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
    setSelectedCustomer(customer);
    setCustomerModalVisible(true);
  };

  const handleViewPaymentDetails = async (payment) => {
    const cached = paymentDetails[payment._id];
    if (cached) {
      setSelectedPayment(cached);
    } else {
      setSelectedPayment(payment);
    }
    setPaymentDetailModalVisible(true);
  };

  const calculateCustomerStats = (customerId) => {
    const payments = billingHistory[customerId] || [];
    const totalPaid = payments
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = payments.length;
    const lastPayment = payments[0];
    
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
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'unpaid': return '#ef4444';
      default: return '#6b7280';
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

  const paymentsForSelectedCustomer = selectedCustomer ? billingHistory[selectedCustomer._id] : undefined;
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10b981" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Billing History</Text>
            <Text style={styles.headerSubtitle}>Track customer payments and billing</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="receipt" size={24} color="white" />
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers by name, phone, or address..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#94a3b8"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading customers...</Text>
          </View>
        )}

        {/* Customers Grid */}
        <View style={styles.customersSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="people" size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>
                {searchQuery ? 'Search Results' : 'All Customers'}
              </Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filteredCustomers.length}</Text>
            </View>
          </View>

          {!loading && filteredCustomers.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              </View>
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
                  activeOpacity={0.8}
                >
                  <View style={styles.customerMain}>
                    <View style={styles.customerAvatar}>
                      <Ionicons 
                        name={customer.customer_type === 'residential' ? 'home' : 'business'} 
                        size={24} 
                        color="white" 
                      />
                    </View>
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerName}>{customer.name}</Text>
                      <View style={styles.customerMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="call-outline" size={14} color="#64748B" />
                          <Text style={styles.metaText}>{customer.phone}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="location-outline" size={14} color="#64748B" />
                          <Text style={styles.metaText}>
                            {customer.house_number}, {customer.street?.streetName}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={[
                      styles.statusIndicator,
                      customer.status === 'active' ? styles.statusActive : styles.statusInactive
                    ]}>
                      <Ionicons 
                        name={customer.status === 'active' ? 'checkmark' : 'close'} 
                        size={16} 
                        color="white" 
                      />
                    </View>
                  </View>

                  {/* Quick Stats */}
                  <View style={styles.statsGrid}>
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
                    <Ionicons name="chevron-forward" size={16} color="#10b981" />
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
                  <View style={styles.modalTitleContainer}>
                    <Text style={styles.modalTitle}>Payment History</Text>
                    <Text style={styles.modalSubtitle}>{selectedCustomer.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setCustomerModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                  {/* Customer Summary */}
                  <View style={styles.customerSummary}>
                    <View style={styles.summaryGrid}>
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
                    <View style={styles.summaryGrid}>
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
                    <View style={styles.sectionHeader}>
                      <Ionicons name="receipt" size={20} color="#10b981" />
                      <Text style={styles.sectionTitle}>Payment Records</Text>
                    </View>
                    
                    {paymentsForSelectedCustomer === undefined ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#10b981" />
                        <Text style={styles.loadingText}>Loading payment records...</Text>
                      </View>
                    ) : paymentsForSelectedCustomer.length === 0 ? (
                      <View style={styles.noPayments}>
                        <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.noPaymentsText}>No payment records found</Text>
                        <Text style={styles.noPaymentsSubtext}>
                          This customer hasn't made any payments yet
                        </Text>
                      </View>
                    ) : (
                      paymentsForSelectedCustomer.map((payment) => (
                        <TouchableOpacity
                          key={payment._id}
                          style={styles.paymentCard}
                          onPress={() => handleViewPaymentDetails(payment)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.paymentHeader}>
                            <View style={styles.paymentInfo}>
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
                          
                          <View style={styles.paymentFooter}>
                            <View style={styles.methodBadge}>
                              <Ionicons 
                                name={payment.payment_method === 'cash' ? 'cash' : 'card'} 
                                size={12} 
                                color="#64748b" 
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
                  <View style={styles.modalTitleContainer}>
                    <Text style={styles.modalTitle}>Payment Details</Text>
                    <Text style={styles.modalSubtitle}>{selectedPayment.receipt_number}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setPaymentDetailModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.detailSection}>
                    <View style={styles.detailSectionHeader}>
                      <Ionicons name="information-circle" size={20} color="#10b981" />
                      <Text style={styles.detailSectionTitle}>Payment Information</Text>
                    </View>
                    <View style={styles.detailGrid}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Amount</Text>
                        <Text style={[styles.detailValue, styles.amountHighlight]}>
                          ₦{selectedPayment.amount.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPayment.payment_status) + '20' }]}>
                          <Ionicons name={getStatusIcon(selectedPayment.payment_status)} size={14} color={getStatusColor(selectedPayment.payment_status)} />
                          <Text style={[styles.statusText, { color: getStatusColor(selectedPayment.payment_status) }]}>
                            {selectedPayment.payment_status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Method</Text>
                        <Text style={styles.detailValue}>
                          {selectedPayment.payment_method.charAt(0).toUpperCase() + selectedPayment.payment_method.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Billing Month</Text>
                        <Text style={styles.detailValue}>{formatMonth(selectedPayment.month)}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Payment Date</Text>
                        <Text style={styles.detailValue}>{formatDate(selectedPayment.payment_date)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <View style={styles.detailSectionHeader}>
                      <Ionicons name="person" size={20} color="#10b981" />
                      <Text style={styles.detailSectionTitle}>Collection Details</Text>
                    </View>
                    <View style={styles.detailGrid}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Collected By</Text>
                        <Text style={styles.detailValue}>
                          {selectedPayment.agent_id?.full_name} ({selectedPayment.agent_id?.role})
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Verification</Text>
                        {selectedPayment.verified ? (
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                            <Text style={styles.verifiedText}>
                              Verified by {selectedPayment.verified_by?.full_name}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.pendingBadge}>
                            <Ionicons name="time" size={14} color="#f59e0b" />
                            <Text style={styles.pendingText}>Pending Verification</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {selectedPayment.agent_notes && (
                    <View style={styles.detailSection}>
                      <View style={styles.detailSectionHeader}>
                        <Ionicons name="document-text" size={20} color="#10b981" />
                        <Text style={styles.detailSectionTitle}>Agent Notes</Text>
                      </View>
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
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchContainer: {
    // Additional container styles if needed
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  content: {
    flex: 1,
  },
  customersSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  countBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  customerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  customerMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#64748b',
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusActive: {
    backgroundColor: '#10b981',
  },
  statusInactive: {
    backgroundColor: '#ef4444',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    gap: 8,
  },
  viewHistoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
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
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 24,
  },
  modalFooter: {
    padding: 24,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  customerSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  paymentHistorySection: {
    marginBottom: 20,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
    color: '#64748b',
  },
  paymentAmountContainer: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  receiptText: {
    fontSize: 12,
    color: '#6b7280',
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
    paddingVertical: 60,
  },
  noPaymentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  noPaymentsSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  detailGrid: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '400',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  amountHighlight: {
    fontWeight: 'bold',
    color: '#10b981',
    fontSize: 16,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pendingText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
  },
  closeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});