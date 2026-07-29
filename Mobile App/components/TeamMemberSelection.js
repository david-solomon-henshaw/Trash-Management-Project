import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const validRoles = ['supervisor', 'driver', 'field_agent', 'admin', 'c_care'];

const TeamMemberSelection = ({ formData, setFormData, staff }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [containerWidth, setContainerWidth] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);

  // console.log(staff, 'staff');

  useEffect(() => {
    if (containerWidth > 0) {
      const minCardWidth = 160;
      const maxCardsPerRow = Math.floor(containerWidth / minCardWidth);
      const actualCardWidth = containerWidth / Math.max(1, Math.min(maxCardsPerRow, 3));
      setCardWidth(actualCardWidth - 16);
    }
  }, [containerWidth]);

  const filteredStaff = staff.filter(
    (item) =>
      item.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleGroups = validRoles.map((role) => ({
    role,
    title: role.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    icon: getRoleIcon(role),
    color: getRoleColor(role),
    members: filteredStaff.filter(
      (item) => item.role === role || (role === 'other' && !validRoles.slice(0, -1).includes(item.role))
    ),
  })).filter((group) => group.members.length > 0);

  function getRoleIcon(role) {
    const icons = {
      supervisor: 'person-circle',
      driver: 'car-sport',
      field_agent: 'walk',
      admin: 'business',
      c_care: 'headset',
      admin: 'person',
      other: 'people'
    };
    return icons[role] || 'person';
  }

  function getRoleColor(role) {
    const colors = {
      supervisor: '#8b5cf6',
      driver: '#10b981',
      field_agent: '#f59e0b',
      admin: '#ef4444',
      c_care: '#6366f1',
      admin: '#ec4899',
      other: '#64748b'
    };
    return colors[role] || '#64748b';
  }

  const toggleTeamMember = (staffId, staffRole) => {
    const isSelected = formData.team_members.some((member) => member.user === staffId);
    const updatedMembers = isSelected
      ? formData.team_members.filter((member) => member.user !== staffId)
      : [...formData.team_members, { user: staffId, role: staffRole, tempId: Date.now() }];
    setFormData({ ...formData, team_members: updatedMembers });
  };

  const renderStaffCard = ({ item }) => {
    const isSelected = formData.team_members.some((member) => member.user === item._id);
    const roleColor = getRoleColor(item.role);

    return (
      <TouchableOpacity
        style={[
          styles.staffCard,
          { width: cardWidth },
          isSelected && [styles.staffCardSelected, { borderColor: roleColor }],
        ]}
        onPress={() => toggleTeamMember(item._id, item.role)}
      >
        <View style={[styles.avatar, { backgroundColor: `${roleColor}15` }]}>
          <Ionicons name={getRoleIcon(item.role)} size={20} color={roleColor} />
        </View>
        <Text style={styles.staffName} numberOfLines={1}>
          {item.full_name}
        </Text>
        <Text style={[styles.roleText, { color: roleColor }]} numberOfLines={1}>
          {item.role.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </Text>
        <View style={styles.cardFooter}>
          <Ionicons
            name={isSelected ? 'checkmark-circle' : 'radio-button-off-outline'}
            size={18}
            color={isSelected ? roleColor : '#D1D5DB'}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderRoleSection = ({ item: group }) => {
    return (
      <View style={styles.roleSection}>
        <View style={styles.sectionHeader}>
          <View style={[styles.roleIcon, { backgroundColor: `${group.color}15` }]}>
            <Ionicons name={group.icon} size={16} color={group.color} />
          </View>
          <Text style={[styles.sectionHeaderText, { color: group.color }]}>
            {group.title}
          </Text>
          <Text style={styles.sectionCount}>({group.members.length})</Text>
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
       // In the header section, change the icon color:
          <View style={[styles.headerIcon, { backgroundColor: 'rgba(22, 160, 133, 0.1)' }]}>
            <Ionicons name="people" size={24} color="#16A085" />
          </View>
          <View>
            <Text style={styles.title}>Team Assembly</Text>
            <Text style={styles.subtitle}>
              {formData.team_members.length > 0
                ? `${formData.team_members.length} member${formData.team_members.length !== 1 ? 's' : ''} selected`
                : 'Build your route team'}
            </Text>
          </View>
        </View>

        {/* Selection Summary */}
        {formData.team_members.length > 0 && (
          <View style={styles.selectionSummary}>
            <View style={styles.summaryChips}>
              {formData.team_members.slice(0, 3).map((member, index) => {
                const staffMember = staff.find(s => s._id === member.user);
                if (!staffMember) return null;
                return (
                  <View key={index} style={[styles.summaryChip, { backgroundColor: `${getRoleColor(staffMember.role)}15` }]}>
                    <Text style={[styles.summaryChipText, { color: getRoleColor(staffMember.role) }]}>
                      {staffMember.full_name.split(' ')[0]}
                    </Text>
                  </View>
                );
              })}
              {formData.team_members.length > 3 && (
                <View style={styles.moreChip}>
                  <Text style={styles.moreChipText}>+{formData.team_members.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search team members..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Team Members Grid */}
      <FlatList
        data={roleGroups}
        renderItem={renderRoleSection}
        keyExtractor={(group) => group.role}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Team Members Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search terms' : 'No staff members available'}
            </Text>
          </View>
        }
      />

      {/* Requirements Hint */}
      <View style={styles.requirements}>
        <Ionicons name="information-circle" size={16} color="#f59e0b" />
        <Text style={styles.requirementsText}>
          Team must include at least one supervisor
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  selectionSummary: {
    marginBottom: 16,
  },
  summaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  summaryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  moreChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 0,
  },
  roleSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  roleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  sectionCount: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  sectionBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  gridCardWrapper: {
    margin: 4,
  },
  staffCard: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    minHeight: 140,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  staffCardSelected: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardFooter: {
    marginTop: 'auto',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  },
  listContent: {
    paddingBottom: 8,
  },
  requirements: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    marginTop: 8,
  },
  requirementsText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
});

export default TeamMemberSelection;