import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Image, Modal, FlatList, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

// Import constants from your external file
import { CURRENCIES, COUNTRY_CURRENCY_MAP, Currency } from '../components/constants/currencies';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;
const isTablet = width >= 768; // Standard tablet threshold

// ─── Reusable Components ──────────────────────────────────────────────────────

const SectionHeader = ({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIconWrap}>
      <FontAwesome5 name={icon} size={isTablet ? 16 : 12} color="#16A085" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

const SectionNote = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.noteBox}>
    <FontAwesome5 name={icon} size={isTablet ? 14 : 10} color="#16A085" style={{ marginTop: 2 }} />
    <Text style={styles.noteText}>{text}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const InputBox = ({ icon, placeholder, flex, secure, value, onChangeText }: any) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={[styles.inputContainer, { flex: flex || (isTablet ? 1 : undefined) }]}>
      <FontAwesome5 name={icon} size={isTablet ? 16 : 12} color="#94a3b8" style={styles.inputIcon} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        style={styles.input}
        secureTextEntry={secure && !isPasswordVisible}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
      />
      {secure && (
        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
          <FontAwesome5 name={isPasswordVisible ? "eye" : "eye-slash"} size={isTablet ? 18 : 14} color="#94a3b8" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const router = useRouter();
  const [logo, setLogo] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [currencyAutoFilled, setCurrencyAutoFilled] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [country, setCountry] = useState('');

  const filteredCurrencies = CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
    c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  const handleCountryChange = (text: string) => {
    setCountry(text);
    const match = COUNTRY_CURRENCY_MAP[text.trim().toLowerCase()];
    if (match) {
      const currency = CURRENCIES.find(c => c.code === match);
      if (currency) {
        setSelectedCurrency(currency);
        setCurrencyAutoFilled(true);
      }
    } else {
      setCurrencyAutoFilled(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) setLogo(result.assets[0].uri);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <BlurView intensity={80} tint="light" style={styles.glassCard}>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.brandRow}>
                  <View style={styles.logoCircle}><FontAwesome5 name="recycle" size={isTablet ? 18 : 14} color="white" /></View>
                  <Text style={styles.brandName}>CleanHaul</Text>
                </View>
                <View style={styles.globalBadge}><Text style={styles.globalBadgeText}>GLOBAL</Text></View>
              </View>

              <Text style={styles.headline}>Start your waste ops in 2 minutes</Text>
              <Text style={styles.subheadline}>Fill in your company details and create an admin account to get started.</Text>

              {/* SECTION 1 — Company Registration */}
              <View style={styles.section}>
                <SectionHeader 
                  icon="building" 
                  title="Company Registration" 
                  subtitle="Details used for invoices, reports & branding." 
                />
                
                <InputBox icon="building" placeholder="Company Name *" />

                {/* Country and Currency row - fixed for small screens */}
                <View style={styles.responsiveRow}>
                  <View style={isSmallScreen ? styles.fullWidth : { flex: 1 }}>
                    <InputBox 
                      icon="globe-americas" 
                      placeholder="Country *" 
                      value={country} 
                      onChangeText={handleCountryChange} 
                    />
                  </View>
                  <View style={isSmallScreen ? styles.fullWidth : { flex: 1 }}>
                    <TouchableOpacity
                      style={[styles.inputContainer, currencyAutoFilled && styles.inputAutoFilled]}
                      onPress={() => setCurrencyModalVisible(true)}
                    >
                      <FontAwesome5 name="coins" size={isTablet ? 16 : 12} color={currencyAutoFilled ? '#16A085' : '#94a3b8'} style={styles.inputIcon} />
                      <Text numberOfLines={1} style={[styles.inputText, { color: selectedCurrency ? '#1e293b' : '#94a3b8' }]}>
                        {selectedCurrency ? `${selectedCurrency.code} (${selectedCurrency.symbol})` : 'Currency *'}
                      </Text>
                      {currencyAutoFilled && <FontAwesome5 name="magic" size={isTablet ? 12 : 9} color="#16A085" style={{marginLeft: 5}} />}
                    </TouchableOpacity>
                  </View>
                </View>

                {currencyAutoFilled && (
                  <SectionNote icon="info-circle" text={`Currency auto-set to ${selectedCurrency?.name}. Tap to change.`} />
                )}

                <View style={{ marginTop: 5 }}>
                  <Text style={styles.fieldLabel}>Company Logo *</Text>
                  <Text style={styles.fieldHint}>Shown on driver apps and customer receipts.</Text>
                </View>

                {logo ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: logo }} style={styles.previewImage} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.previewFilename}>Logo uploaded ✓</Text>
                      <Text style={styles.fieldHint}>Square (1:1) works best</Text>
                    </View>
                    <TouchableOpacity onPress={() => setLogo(null)}><Text style={styles.removeText}>Remove</Text></TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
                    <FontAwesome5 name="cloud-upload-alt" size={isTablet ? 24 : 18} color="#16A085" />
                    <Text style={styles.uploadText}>Tap to <Text style={styles.underline}>browse</Text> logo</Text>
                    <Text style={styles.uploadSubtext}>PNG, JPG or SVG • Max 2MB</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Divider />

              {/* SECTION 2 — Admin Account */}
              <View style={styles.section}>
                <SectionHeader 
                  icon="user-shield" 
                  title="Admin Account" 
                  subtitle="This user manages trucks, routes & billing." 
                />

                {/* Full Name and Phone row - fixed for small screens */}
                <View style={styles.responsiveRow}>
                  <View style={isSmallScreen ? styles.fullWidth : { flex: 1 }}>
                    <InputBox icon="user-tie" placeholder="Full Name *" />
                  </View>
                  <View style={isSmallScreen ? styles.fullWidth : { flex: 1 }}>
                    <InputBox icon="phone" placeholder="Phone *" />
                  </View>
                </View>

                <InputBox icon="envelope" placeholder="Work Email *" />
                <Text style={styles.fieldHint}>This will be your primary login email.</Text>

                {/* Password and Confirm row - fixed for small screens */}
                <View style={styles.responsiveRow}>
                  <View style={isSmallScreen ? styles.fullWidth : { flex: 1 }}>
                    <InputBox icon="lock" placeholder="Password *" secure />
                  </View>
                  <View style={isSmallScreen ? styles.fullWidth : { flex: 1 }}>
                    <InputBox icon="lock" placeholder="Confirm *" secure />
                  </View>
                </View>
                <Text style={styles.fieldHint}>Min. 8 characters with 1 letter and 1 number.</Text>
              </View>

              <Divider />

              {/* SUBMIT */}
              <View style={styles.section}>
                <SectionNote 
                  icon="shield-alt" 
                  text="Your data is encrypted. You can delete your account at any time." 
                />

                <TouchableOpacity style={styles.submitButton}>
                  <FontAwesome5 name="check-circle" size={isTablet ? 18 : 14} color="white" />
                  <Text style={styles.submitText}>Create Account</Text>
                  <FontAwesome5 name="arrow-right" size={isTablet ? 16 : 12} color="white" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/')} style={styles.footerLink}>
                  <Text style={styles.footerText}>Already have an account? <Text style={styles.link}>Sign in →</Text></Text>
                </TouchableOpacity>

                <Text style={styles.tagline}>CLEAN • SMART • RELIABLE</Text>
              </View>

            </BlurView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Currency Modal */}
      <Modal visible={currencyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="light" style={styles.modalCard}>
             <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Select Currency</Text>
                  <Text style={styles.modalSubtitle}>Used for invoices & reporting</Text>
                </View>
                <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                  <FontAwesome5 name="times" size={isTablet ? 20 : 16} color="#64748b" />
                </TouchableOpacity>
             </View>
             <View style={styles.searchBox}>
               <FontAwesome5 name="search" size={isTablet ? 16 : 12} color="#94a3b8" style={{marginRight: 10}} />
               <TextInput 
                  style={styles.searchInput} 
                  placeholder="Search currency..." 
                  value={currencySearch} 
                  onChangeText={setCurrencySearch} 
                />
             </View>
             <FlatList
                data={filteredCurrencies}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.currencyItem} 
                    onPress={() => { setSelectedCurrency(item); setCurrencyModalVisible(false); }}
                  >
                    <Text style={styles.currencyCode}>{item.code} — <Text style={{fontWeight:'400'}}>{item.name}</Text></Text>
                    <Text style={styles.currencySymbol}>{item.symbol}</Text>
                  </TouchableOpacity>
                )}
             />
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  safeArea: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    padding: isTablet ? 40 : (isSmallScreen ? 12 : 20), 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  blob: { position: 'absolute', width: isTablet ? 500 : 300, height: isTablet ? 500 : 300, borderRadius: 250, opacity: 0.4 },
  blob1: { top: -100, left: -100, backgroundColor: '#16A085' },
  blob2: { bottom: -100, right: -100, backgroundColor: '#f59e0b' },
  glassCard: { 
    width: '100%', 
    maxWidth: isTablet ? 700 : 480, // Wider card for tablets
    borderRadius: isTablet ? 32 : 24, 
    padding: isTablet ? 40 : (isSmallScreen ? 16 : 24), 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.5)', 
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 20
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logoCircle: { 
    width: isTablet ? 36 : 26, 
    height: isTablet ? 36 : 26, 
    borderRadius: 18, 
    backgroundColor: '#16A085', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  brandName: { marginLeft: 10, fontSize: isTablet ? 24 : 18, fontWeight: 'bold', color: '#1e293b' },
  globalBadge: { backgroundColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, alignSelf: 'center' },
  globalBadgeText: { fontSize: isTablet ? 12 : 8, fontWeight: '900', color: '#64748b' },
  headline: { fontSize: isTablet ? 22 : 16, fontWeight: '700', color: '#334155', marginBottom: 6 },
  subheadline: { fontSize: isTablet ? 15 : 11, color: '#64748b', marginBottom: 25, lineHeight: isTablet ? 22 : 16 },
  section: { gap: isTablet ? 15 : 10 },
  sectionHeader: { 
    flexDirection: 'row', 
    gap: 12, 
    backgroundColor: 'rgba(22,160,133,0.07)', 
    borderRadius: 16, 
    padding: isTablet ? 16 : 10, 
    borderLeftWidth: 4, 
    borderLeftColor: '#16A085' 
  },
  sectionIconWrap: { 
    width: isTablet ? 32 : 24, 
    height: isTablet ? 32 : 24, 
    borderRadius: 10, 
    backgroundColor: 'rgba(22,160,133,0.15)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sectionTitle: { fontSize: isTablet ? 16 : 12, fontWeight: '800', color: '#1e293b' },
  sectionSubtitle: { fontSize: isTablet ? 13 : 10, color: '#64748b' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: isTablet ? 24 : 16 },
  noteBox: { 
    flexDirection: 'row', 
    gap: 8, 
    backgroundColor: 'rgba(22,160,133,0.06)', 
    borderRadius: 10, 
    padding: isTablet ? 14 : 10 
  },
  noteText: { flex: 1, fontSize: isTablet ? 13 : 10, color: '#475569', lineHeight: isTablet ? 18 : 14 },
  responsiveRow: { 
    flexDirection: 'row', 
    gap: 12, 
    flexWrap: 'wrap' 
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    paddingHorizontal: 15, 
    height: isTablet ? 60 : 48 
  },
  inputAutoFilled: { borderColor: '#16A085', backgroundColor: '#f0fdfa' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: isTablet ? 16 : 13, color: '#1e293b' },
  inputText: { flex: 1, fontSize: isTablet ? 16 : 13 },
  eyeIcon: { padding: 5 },
  fieldLabel: { fontSize: isTablet ? 14 : 11, fontWeight: '700', color: '#475569' },
  fieldHint: { fontSize: isTablet ? 12 : 9, color: '#94a3b8', marginTop: 3 },
  uploadArea: { 
    borderWidth: 1, 
    borderStyle: 'dashed', 
    borderColor: '#16A085', 
    borderRadius: 16, 
    padding: isTablet ? 24 : 12, 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.3)' 
  },
  uploadText: { fontSize: isTablet ? 14 : 11, color: '#475569', marginTop: 8 },
  uploadSubtext: { fontSize: isTablet ? 11 : 8, color: '#94a3b8', marginTop: 4 },
  underline: { textDecorationLine: 'underline', color: '#16A085', fontWeight: 'bold' },
  previewContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    padding: isTablet ? 15 : 10, 
    backgroundColor: 'white', 
    borderRadius: 14 
  },
  previewImage: { width: isTablet ? 50 : 36, height: isTablet ? 50 : 36, borderRadius: 10 },
  previewFilename: { fontSize: isTablet ? 14 : 11, fontWeight: '600', color: '#16A085' },
  removeText: { fontSize: isTablet ? 13 : 10, color: '#ef4444', fontWeight: '600' },
  submitButton: { 
    backgroundColor: '#16A085', 
    height: isTablet ? 64 : 52, 
    borderRadius: 32, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 12, 
    marginTop: 15 
  },
  submitText: { color: 'white', fontWeight: 'bold', fontSize: isTablet ? 18 : 15 },
  footerLink: { alignItems: 'center', marginTop: 15 },
  footerText: { fontSize: isTablet ? 14 : 11, color: '#64748b' },
  link: { color: '#16A085', fontWeight: 'bold' },
  tagline: { fontSize: isTablet ? 11 : 8, fontWeight: '900', color: '#cbd5e1', textAlign: 'center', marginTop: 30, letterSpacing: 3 },
  
  // New style for full width on small screens
  fullWidth: { width: '100%' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { 
    width: isTablet ? '60%' : '100%',
    maxHeight: isTablet ? '70%' : '80%',
    borderRadius: isTablet ? 24 : 0,
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: isTablet ? 30 : 20, 
    backgroundColor: 'white', 
    overflow: 'hidden' 
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: isTablet ? 22 : 18, fontWeight: 'bold', color: '#1e293b' },
  modalSubtitle: { fontSize: isTablet ? 14 : 11, color: '#64748b' },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f1f5f9', 
    borderRadius: 14, 
    paddingHorizontal: 15, 
    height: isTablet ? 55 : 45, 
    marginBottom: 20 
  },
  searchInput: { flex: 1, fontSize: isTablet ? 16 : 14, color: '#1e293b' },
  currencyItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: isTablet ? 20 : 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  currencyCode: { fontSize: isTablet ? 17 : 14, fontWeight: '700', color: '#1e293b' },
  currencySymbol: { fontSize: isTablet ? 17 : 14, fontWeight: 'bold', color: '#16A085' },
});