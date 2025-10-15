import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const validRoles = ['supervisor', 'driver', 'field_agent', 'ceo', 'c_care', 'manager', 'other'];

const TeamMemberSelection = ({ formData, setFormData, staff }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [containerWidth, setContainerWidth] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);

  // Calculate dynamic card width based on container width
  useEffect(() => {
    if (containerWidth > 0) {
      // Calculate how many cards can fit (minimum 150px per card)
      const minCardWidth = 150;
      const maxCardsPerRow = Math.floor(containerWidth / minCardWidth);
      const actualCardWidth = containerWidth / Math.max(1, Math.min(maxCardsPerRow, 4)); // Max 4 cards per row
      setCardWidth(actualCardWidth - 16); // Subtract padding/margins
    }
  }, [containerWidth]);

  // Filter staff
  const filteredStaff = staff.filter(
    (item) =>
      item.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by role + format titles
  const roleGroups = validRoles.map((role) => ({
    role,
    title: role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    members: filteredStaff.filter(
      (item) => item.role === role || (role === 'other' && !validRoles.slice(0, -1).includes(item.role))
    ),
  })).filter((group) => group.members.length > 0);

  // Toggle selection
  const toggleTeamMember = (staffId, staffRole) => {
    const isSelected = formData.team_members.some((member) => member.user === staffId);
    const updatedMembers = isSelected
      ? formData.team_members.filter((member) => member.user !== staffId)
      : [...formData.team_members, { user: staffId, role: staffRole, tempId: Date.now() }];
    setFormData({ ...formData, team_members: updatedMembers });
  };

  // Render a single staff card
  const renderStaffCard = ({ item }) => {
    const isSelected = formData.team_members.some((member) => member.user === item._id);
    return (
      <TouchableOpacity
        style={[
          styles.staffCard,
          { width: cardWidth },
          isSelected && styles.staffCardSelected,
        ]}
        onPress={() => toggleTeamMember(item._id, item.role)}
      >
        <View style={styles.avatar}>
          <Ionicons
            name="person-outline"
            size={20}
            color={isSelected ? '#FFFFFF' : '#3B82F6'}
          />
        </View>
        <Text style={styles.staffName} numberOfLines={1}>
          {item.full_name}
        </Text>
        <Text style={styles.roleText} numberOfLines={1}>
          {item.role
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')}
        </Text>
        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'radio-button-off-outline'}
          size={18}
          color={isSelected ? '#10B981' : '#D1D5DB'}
          style={styles.checkIcon}
        />
      </TouchableOpacity>
    );
  };

  // Render a role section
  const renderRoleSection = ({ item: group }) => {
    return (
      <>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{group.title}</Text>
        </View>
        <View
          style={styles.sectionBody}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (width !== containerWidth) {
              setContainerWidth(width);
            }
          }}
        >
          {group.members.map((member) => (
            <View key={member._id} style={styles.gridCardWrapper}>
              {renderStaffCard({ item: member })}
            </View>
          ))}
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Members</Text>
        <Text style={styles.subtitle}>
          {formData.team_members.length > 0
            ? `${formData.team_members.length} selected`
            : 'Select team for this route'}
        </Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or role..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <FlatList
        data={roleGroups}
        renderItem={renderRoleSection}
        keyExtractor={(group) => group.role}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  },
  sectionHeader: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  gridCardWrapper: {
    margin: 4,
  },
  staffCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minHeight: 130,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  staffCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  checkIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
});

export default TeamMemberSelection;
