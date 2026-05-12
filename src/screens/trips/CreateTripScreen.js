import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { tripService } from '../../services/tripService';
import { SUPPORTED_CURRENCIES, HOME_CURRENCY } from '../../utils/currency';
import { COUNTRIES } from '../../utils/countries';
import { STATES_BY_COUNTRY } from '../../utils/states';
import Toast from 'react-native-toast-message';
import { C, F } from '../../theme/postage';

const COMMON_CURRENCIES = ['SGD', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'THB', 'VND'];
const DEST_ACCENTS = [C.stamp, C.ochre, C.blue];

const fmtDate = (text) => {
  const d = text.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)} / ${d.slice(2)}`;
  return `${d.slice(0, 2)} / ${d.slice(2, 4)} / ${d.slice(4)}`;
};

const toIso = (s) => {
  const parts = s.split('/').map(p => p.trim());
  if (parts.length !== 3 || parts[2].length < 4) return null;
  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
};

export default function CreateTripScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [currencies, setCurrencies] = useState(['SGD']);
  const [homeCurrency, setHomeCurrency] = useState(HOME_CURRENCY);
  const [homeSameAsBase, setHomeSameAsBase] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [memberName, setMemberName] = useState('');
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePicker, setActivePicker] = useState(null); // 'base' | 'home' | 'country' | null

  const [destinations, setDestinations] = useState([]);
  const [pendingCountry, setPendingCountry] = useState('');
  const [pendingProvince, setPendingProvince] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [provinceSearch, setProvinceSearch] = useState('');

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    return q ? COUNTRIES.filter(c => c.toLowerCase().includes(q)) : COUNTRIES;
  }, [countrySearch]);

  const toggleCurrency = (c) => {
    setCurrencies(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const addDestination = () => {
    if (!pendingCountry) {
      Toast.show({ type: 'error', text1: 'Select a country first', position: 'bottom' });
      return;
    }
    setDestinations(prev => [...prev, { country: pendingCountry, province: pendingProvince.trim() }]);
    setPendingCountry('');
    setPendingProvince('');
    setCountrySearch('');
    setActivePicker(null);
  };

  const addMember = () => {
    const trimmed = memberName.trim();
    if (!trimmed) {
      Toast.show({ type: 'error', text1: 'Enter a name first', position: 'bottom' });
      return;
    }
    if (pendingMembers.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
      Toast.show({ type: 'error', text1: 'Already added', position: 'bottom' });
      return;
    }
    setPendingMembers(prev => [...prev, trimmed]);
    setMemberName('');
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Trip name is required', position: 'bottom' });
      return;
    }
    if (currencies.length === 0) {
      Toast.show({ type: 'error', text1: 'Select at least one currency', position: 'bottom' });
      return;
    }
    setLoading(true);
    try {
      const effectiveHome = homeSameAsBase ? currencies[0] : homeCurrency;
      const trip = await tripService.create(
        name.trim(), currencies[0], effectiveHome, destinations,
        startDate ? toIso(startDate) : null,
        endDate ? toIso(endDate) : null,
      );
      for (const mn of pendingMembers) {
        await tripService.addMember(trip.id, mn);
      }
      Toast.show({ type: 'success', text1: 'Trip created!', position: 'bottom' });
      navigation.replace('TripDetail', { tripId: trip.id, tripName: trip.name });
    } catch (e) {
      const msg = e.response?.data?.message
        ?? (!e.response ? 'Cannot reach server — is the backend running?' : `Server error (${e.response.status})`);
      Toast.show({ type: 'error', text1: msg, position: 'bottom' });
    } finally {
      setLoading(false);
    }
  };

  const renderCountryPicker = () => (
    <View style={styles.pickerCard}>
      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={13} color={C.inkLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search country…"
          placeholderTextColor={C.border}
          value={countrySearch}
          onChangeText={setCountrySearch}
          autoCorrect={false}
          autoCapitalize="words"
        />
      </View>
      <ScrollView style={styles.countryScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {filteredCountries.map((c, i) => (
          <Pressable
            key={c}
            style={[styles.pickerItem, i > 0 && styles.pickerItemBorder, c === pendingCountry && styles.pickerItemActive]}
            onPress={() => { setPendingCountry(c); setPendingProvince(''); setCountrySearch(''); setProvinceSearch(''); setActivePicker(null); }}
          >
            <Text style={[styles.pickerText, c === pendingCountry && styles.pickerTextActive]}>{c}</Text>
          </Pressable>
        ))}
        {filteredCountries.length === 0 && <Text style={styles.noResult}>No match</Text>}
      </ScrollView>
    </View>
  );

  const renderProvincePicker = () => {
    const states = STATES_BY_COUNTRY[pendingCountry] || [];
    const filtered = provinceSearch.trim()
      ? states.filter(s => s.toLowerCase().includes(provinceSearch.trim().toLowerCase()))
      : states;
    return (
      <View style={styles.pickerCard}>
        <View style={styles.searchRow}>
          <MaterialIcons name="search" size={13} color={C.inkLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search state / province…"
            placeholderTextColor={C.border}
            value={provinceSearch}
            onChangeText={setProvinceSearch}
            autoCorrect={false}
            autoCapitalize="words"
          />
        </View>
        <ScrollView style={styles.countryScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {filtered.map((s, i) => (
            <Pressable
              key={s}
              style={[styles.pickerItem, i > 0 && styles.pickerItemBorder, s === pendingProvince && styles.pickerItemActive]}
              onPress={() => { setPendingProvince(s); setProvinceSearch(''); setActivePicker(null); }}
            >
              <Text style={[styles.pickerText, s === pendingProvince && styles.pickerTextActive]}>{s}</Text>
            </Pressable>
          ))}
          {filtered.length === 0 && <Text style={styles.noResult}>No match</Text>}
        </ScrollView>
      </View>
    );
  };

  const renderBasePicker = () => (
    <ScrollView style={styles.pickerCard} nestedScrollEnabled keyboardShouldPersistTaps="handled">
      {SUPPORTED_CURRENCIES.map((c, i) => (
        <Pressable
          key={c}
          style={[styles.pickerItem, i > 0 && styles.pickerItemBorder, currencies.includes(c) && styles.pickerItemActive]}
          onPress={() => toggleCurrency(c)}
        >
          <Text style={[styles.pickerText, currencies.includes(c) && styles.pickerTextActive]}>{c}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderHomePicker = () => (
    <ScrollView style={styles.pickerCard} nestedScrollEnabled keyboardShouldPersistTaps="handled">
      {SUPPORTED_CURRENCIES.map((c, i) => (
        <Pressable
          key={c}
          style={[styles.pickerItem, i > 0 && styles.pickerItemBorder, c === homeCurrency && styles.pickerItemActive]}
          onPress={() => { setHomeCurrency(c); setHomeSameAsBase(false); setActivePicker(null); }}
        >
          <Text style={[styles.pickerText, c === homeCurrency && styles.pickerTextActive]}>{c}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Custom header */}
      <View style={[styles.header, { paddingTop: 10 + insets.top }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.headerNav}>← TRIPS</Text>
        </Pressable>
        <Text style={styles.headerEdition}>VOYAGE · ED.III</Text>
      </View>

      {/* Corner stamp (decorative) */}
      <View style={[styles.cornerStamp, { top: 42 + insets.top }]} pointerEvents="none">
        <View style={styles.stampOuter}>
          <View style={styles.stampInner}>
            <Text style={styles.stampGlyph}>＋</Text>
            <Text style={styles.stampLabel}>NEW</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={styles.titleCaption}>VOL. 04 · ISSUE PASSAGE</Text>
          <Text style={styles.titleSerif}>Plan a journey</Text>
          <Text style={styles.titleSub}>FILL THE WAYBILL · STAMP TO BEGIN</Text>
        </View>

        {/* Trip name */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>TRIP NAME</Text>
          <TextInput
            style={styles.serifInput}
            placeholder="e.g. Southeast Asia, Spring"
            placeholderTextColor={C.border}
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.fieldHint}>VISIBLE TO ALL MEMBERS</Text>
        </View>

        {/* Voyage dates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>VOYAGE DATES</Text>
            <Text style={styles.sectionNote}>OPTIONAL</Text>
          </View>
          <View style={styles.datesRow}>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>DEPART</Text>
              <TextInput
                style={[styles.serifInput, styles.dateInput]}
                placeholder="DD / MM / YYYY"
                placeholderTextColor={C.border}
                keyboardType="numeric"
                value={startDate}
                onChangeText={t => setStartDate(fmtDate(t))}
                maxLength={14}
              />
            </View>
            <View style={styles.dateSep} />
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>RETURN</Text>
              <TextInput
                style={[styles.serifInput, styles.dateInput]}
                placeholder="DD / MM / YYYY"
                placeholderTextColor={C.border}
                keyboardType="numeric"
                value={endDate}
                onChangeText={t => setEndDate(fmtDate(t))}
                maxLength={14}
              />
            </View>
          </View>
        </View>

        {/* Trip currencies chips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>TRIP CURRENCIES</Text>
          </View>
          <View style={styles.chipWrap}>
            {COMMON_CURRENCIES.map(c => (
              <Pressable
                key={c}
                style={[styles.chip, currencies.includes(c) && styles.chipSelected]}
                onPress={() => toggleCurrency(c)}
              >
                <Text style={[styles.chipCode, currencies.includes(c) && styles.chipCodeSelected]}>{c}</Text>
              </Pressable>
            ))}
            {currencies.filter(c => !COMMON_CURRENCIES.includes(c)).map(c => (
              <Pressable key={c} style={styles.chipSelected} onPress={() => toggleCurrency(c)}>
                <Text style={styles.chipCodeSelected}>{c}</Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.chipMore}
              onPress={() => setActivePicker(activePicker === 'base' ? null : 'base')}
            >
              <Text style={styles.chipMoreText}>＋ MORE</Text>
            </Pressable>
          </View>
          {activePicker === 'base' && renderBasePicker()}

          {/* Home currency chips */}
          <View style={styles.homeCurrDivider}>
            <Text style={styles.homeCurrLabel}>HOME CURRENCY</Text>
          </View>
          <View style={styles.chipWrap}>
            {COMMON_CURRENCIES.map(c => (
              <Pressable
                key={c}
                style={[styles.chip, !homeSameAsBase && homeCurrency === c && styles.chipSelected]}
                onPress={() => { setHomeCurrency(c); setHomeSameAsBase(false); setActivePicker(null); }}
              >
                <Text style={[styles.chipCode, !homeSameAsBase && homeCurrency === c && styles.chipCodeSelected]}>{c}</Text>
              </Pressable>
            ))}
            {!homeSameAsBase && !COMMON_CURRENCIES.includes(homeCurrency) && (
              <View style={styles.chipSelected}>
                <Text style={styles.chipCodeSelected}>{homeCurrency}</Text>
              </View>
            )}
            <Pressable
              style={styles.chipMore}
              onPress={() => setActivePicker(activePicker === 'home' ? null : 'home')}
            >
              <Text style={styles.chipMoreText}>＋ MORE</Text>
            </Pressable>
          </View>
          {activePicker === 'home' && renderHomePicker()}

          <Text style={styles.fieldHint}>FX UPDATES DAILY</Text>
        </View>

        {/* Destinations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>DESTINATIONS</Text>
              <Text style={[styles.fieldHint, { marginTop: 1 }]}>OPTIONAL · ADD AS MANY STOPS AS YOU LIKE</Text>
            </View>
            <Pressable
              style={styles.smallDarkBtn}
              onPress={() => { setActivePicker(activePicker === 'country' ? null : 'country'); setCountrySearch(''); }}
            >
              <Text style={styles.smallDarkBtnText}>＋ STOP</Text>
            </Pressable>
          </View>

          {/* Route stops */}
          {destinations.length > 0 && (
            <View style={styles.routeContainer}>
              {destinations.length > 1 && <View style={styles.routeLine} />}
              {destinations.map((d, i) => {
                const accent = DEST_ACCENTS[i % DEST_ACCENTS.length];
                const code = (d.province || d.country).slice(0, 3).toUpperCase();
                return (
                  <View key={i} style={[styles.stopRow, i > 0 && styles.stopRowBorder]}>
                    <View style={styles.stopDotCol}>
                      <View style={[styles.stopDot, { borderColor: accent }]} />
                    </View>
                    <Text style={[styles.stopCode, { color: accent }]}>{code}</Text>
                    <View style={styles.stopInfo}>
                      <Text style={styles.stopCity}>{d.province || d.country}</Text>
                      <Text style={styles.stopCountry}>{d.country.toUpperCase()}</Text>
                    </View>
                    <Pressable hitSlop={12} onPress={() => setDestinations(prev => prev.filter((_, idx) => idx !== i))}>
                      <MaterialIcons name="close" size={14} color={C.inkLight} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          {/* Country search trigger */}
          <Pressable
            style={styles.destSearchBox}
            onPress={() => { setActivePicker(activePicker === 'country' ? null : 'country'); setCountrySearch(''); }}
          >
            <Text style={[styles.destSearchText, !pendingCountry && styles.destSearchPlaceholder]}>
              {pendingCountry || 'Search a country — Japan, France, Brazil…'}
            </Text>
          </Pressable>
          {activePicker === 'country' && renderCountryPicker()}

          {/* State / province (shown when country selected) */}
          {!!pendingCountry && (
            <>
              <View style={styles.provinceRow}>
                {(STATES_BY_COUNTRY[pendingCountry]?.length ?? 0) > 0 ? (
                  <Pressable
                    style={styles.provincePickerTrigger}
                    onPress={() => setActivePicker(activePicker === 'province' ? null : 'province')}
                  >
                    <Text style={[styles.destSearchText, !pendingProvince && styles.destSearchPlaceholder]}>
                      {pendingProvince || 'State / Province — optional'}
                    </Text>
                    <MaterialIcons
                      name={activePicker === 'province' ? 'expand-less' : 'expand-more'}
                      size={16} color={C.inkLight}
                    />
                  </Pressable>
                ) : (
                  <TextInput
                    style={[styles.serifInput, { flex: 1 }]}
                    placeholder="State / province (optional)"
                    placeholderTextColor={C.border}
                    value={pendingProvince}
                    onChangeText={setPendingProvince}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={addDestination}
                  />
                )}
                <Pressable style={styles.confirmStopBtn} onPress={addDestination}>
                  <MaterialIcons name="add-location" size={16} color={C.surface} />
                </Pressable>
              </View>
              {activePicker === 'province' && renderProvincePicker()}
            </>
          )}

          <Text style={[styles.fieldHint, { marginTop: 8 }]}>SKIP IF YOUR JOURNEY HAS NO FIXED ITINERARY</Text>
        </View>

        {/* Fellow travellers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>FELLOW TRAVELLERS</Text>
              <Text style={[styles.fieldHint, { marginTop: 1 }]}>
                {pendingMembers.length + 1} INVITED · YOU AS HOST
              </Text>
            </View>
            <Pressable style={styles.smallDarkBtn} onPress={addMember}>
              <Text style={styles.smallDarkBtnText}>＋ INVITE</Text>
            </Pressable>
          </View>

          {/* Member rows */}
          {pendingMembers.length > 0 && (
            <View style={styles.memberList}>
              {pendingMembers.map((m, i) => (
                <View key={m} style={[styles.memberRow, i > 0 && styles.memberRowBorder]}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{m.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{m}</Text>
                  </View>
                  <Pressable
                    hitSlop={10}
                    onPress={() => setPendingMembers(prev => prev.filter(x => x !== m))}
                  >
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>REMOVE</Text>
                    </View>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Add traveller input */}
          <View style={styles.memberAddRow}>
            <View style={styles.memberAddCircle}>
              <Text style={styles.memberAddPlus}>+</Text>
            </View>
            <TextInput
              style={styles.memberAddInput}
              placeholder="Add a traveller by name"
              placeholderTextColor={C.border}
              autoCapitalize="words"
              value={memberName}
              onChangeText={setMemberName}
              onSubmitEditing={addMember}
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Sticky submit bar */}
      <View style={[styles.submitBar, { paddingBottom: 14 + insets.bottom }]}>
        <View style={styles.submitSummary}>
          <Text style={styles.submitHint}>WAYBILL · STAMP TO ISSUE</Text>
          <Text style={styles.submitDetail}>
            {pendingMembers.length + 1} traveller{pendingMembers.length !== 0 ? 's' : ''} · {destinations.length} stop{destinations.length !== 1 ? 's' : ''} · {currencies.join(' · ')}
          </Text>
        </View>
        <Pressable
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={C.surface} size="small" />
            : <Text style={styles.submitBtnText}>Start the trip  →</Text>
          }
        </Pressable>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.divider,
    backgroundColor: C.bg,
  },
  headerNav: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 1.5 },
  headerEdition: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 1.5, opacity: 0.6 },

  // Corner stamp
  cornerStamp: {
    position: 'absolute', right: 18, zIndex: 10,
    transform: [{ rotate: '8deg' }],
  },
  stampOuter: {
    width: 56, height: 70, borderWidth: 2, borderColor: C.stamp,
    backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
    shadowColor: C.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 4,
    elevation: 3,
  },
  stampInner: {
    position: 'absolute', inset: 5, borderWidth: 1, borderColor: C.stamp,
    justifyContent: 'center', alignItems: 'center',
  },
  stampGlyph: { fontFamily: F.serif, fontSize: 20, fontStyle: 'italic', color: C.stamp, fontWeight: '600' },
  stampLabel: { fontFamily: F.mono, fontSize: 7, color: C.stamp, letterSpacing: 2, marginTop: 2 },

  // Scroll container
  container: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 20 },

  // Title block
  titleBlock: { paddingRight: 70, marginBottom: 8 },
  titleCaption: { fontFamily: F.mono, fontSize: 9, color: C.inkLight, letterSpacing: 2.2 },
  titleSerif: { fontFamily: F.serif, fontSize: 34, fontStyle: 'italic', color: C.ink, fontWeight: '500', lineHeight: 38, marginTop: 4 },
  titleSub: { fontFamily: F.mono, fontSize: 8, color: C.inkLight, letterSpacing: 1.5, marginTop: 4 },

  // Sections
  section: { marginTop: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  sectionLabel: { fontFamily: F.mono, fontSize: 9, color: C.inkLight, letterSpacing: 2, textTransform: 'uppercase' },
  sectionNote: { fontFamily: F.mono, fontSize: 8, color: C.inkLight, letterSpacing: 1.2, opacity: 0.8 },

  // Field
  fieldLabel: { fontFamily: F.mono, fontSize: 8, color: C.inkLight, letterSpacing: 1.5, marginBottom: 4 },
  fieldHint: { fontFamily: F.mono, fontSize: 7.5, color: C.inkLight, letterSpacing: 1.2, opacity: 0.8 },

  // Serif input
  serifInput: {
    fontFamily: F.serif, fontSize: 20, fontStyle: 'italic', color: C.ink,
    borderBottomWidth: 1.5, borderBottomColor: C.ink, paddingVertical: 6, marginBottom: 6,
    backgroundColor: 'transparent',
  },

  // Currency chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: {
    paddingVertical: 5, paddingHorizontal: 10,
    borderWidth: 1, borderColor: C.border,
  },
  chipSelected: {
    paddingVertical: 5, paddingHorizontal: 10,
    backgroundColor: C.ink,
  },
  chipCode: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.4, color: C.inkMid },
  chipCodeSelected: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.4, color: C.surface, fontWeight: '700' },
  chipMore: {
    paddingVertical: 5, paddingHorizontal: 10,
    borderWidth: 1, borderColor: C.border, borderStyle: 'dashed',
  },
  chipMoreText: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.inkLight },

  // Voyage dates
  datesRow: { flexDirection: 'row', alignItems: 'flex-end' },
  dateField: { flex: 1 },
  dateSep: { width: 1, height: 32, backgroundColor: C.divider, marginHorizontal: 14, marginBottom: 6 },
  dateInput: { fontSize: 15, marginBottom: 0 },

  // Home currency divider header
  homeCurrDivider: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: C.divider, paddingTop: 10, marginTop: 6, marginBottom: 8,
  },
  homeCurrLabel: { fontFamily: F.mono, fontSize: 8, color: C.inkLight, letterSpacing: 1.5 },

  // Picker
  pickerCard: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    marginTop: 6, maxHeight: 220,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  searchInput: { flex: 1, fontFamily: F.mono, fontSize: 12, color: C.ink, paddingVertical: 2 },
  countryScroll: { maxHeight: 180 },
  pickerItem: { paddingVertical: 10, paddingHorizontal: 14 },
  pickerItemBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  pickerItemActive: { backgroundColor: C.stampSoft },
  pickerText: { fontFamily: F.mono, fontSize: 12, color: C.inkMid },
  pickerTextActive: { color: C.stamp, fontWeight: '700' },
  noResult: { fontFamily: F.mono, fontSize: 11, color: C.inkLight, textAlign: 'center', padding: 14 },

  // Small dark button (＋ STOP / ＋ INVITE)
  smallDarkBtn: {
    paddingVertical: 4, paddingHorizontal: 10,
    backgroundColor: C.ink,
  },
  smallDarkBtnText: { fontFamily: F.mono, fontSize: 9, color: C.surface, letterSpacing: 1.4 },

  // Destinations route
  routeContainer: { position: 'relative', marginTop: 10, marginBottom: 8, paddingLeft: 28 },
  routeLine: {
    position: 'absolute', left: 11, top: 20, bottom: 20,
    width: 1, backgroundColor: C.border,
  },
  stopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  stopRowBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  stopDotCol: { position: 'absolute', left: -17, alignItems: 'center', justifyContent: 'center', width: 10 },
  stopDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.bg, borderWidth: 1.5,
  },
  stopCode: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, fontWeight: '700', width: 38 },
  stopInfo: { flex: 1, minWidth: 0 },
  stopCity: { fontFamily: F.serif, fontSize: 15, fontStyle: 'italic', color: C.ink },
  stopCountry: { fontFamily: F.mono, fontSize: 7.5, color: C.inkLight, letterSpacing: 1.2, marginTop: 1 },

  // Destination search box
  destSearchBox: {
    borderWidth: 1, borderColor: C.border, borderStyle: 'dashed',
    paddingHorizontal: 12, paddingVertical: 10, marginTop: 4,
  },
  destSearchText: { fontFamily: F.serif, fontSize: 13, fontStyle: 'italic', color: C.ink },
  destSearchPlaceholder: { color: C.border },

  // Province row
  provinceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  provincePickerTrigger: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: C.border, borderStyle: 'dashed',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  confirmStopBtn: {
    backgroundColor: C.stamp, padding: 11,
    justifyContent: 'center', alignItems: 'center',
  },

  // Members
  memberList: {
    borderWidth: 1, borderColor: C.border, marginTop: 10, marginBottom: 6,
    backgroundColor: C.surface,
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, gap: 10 },
  memberRowBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  memberAvatar: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center', backgroundColor: C.stampSoft,
  },
  memberAvatarText: { fontFamily: F.serif, fontSize: 13, fontStyle: 'italic', color: C.stamp },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: { fontFamily: F.serif, fontSize: 14, fontStyle: 'italic', color: C.ink },
  memberSub: { fontFamily: F.mono, fontSize: 7.5, color: C.inkLight, letterSpacing: 1, marginTop: 1 },
  badge: {
    paddingVertical: 2, paddingHorizontal: 6, backgroundColor: C.ink,
  },
  badgeText: { fontFamily: F.mono, fontSize: 8, color: C.surface, letterSpacing: 1.5 },

  // Add member input row
  memberAddRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: C.border, borderStyle: 'dashed',
    paddingHorizontal: 12, paddingVertical: 8, marginTop: 6,
  },
  memberAddCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1, borderColor: C.inkLight,
    justifyContent: 'center', alignItems: 'center',
  },
  memberAddPlus: { fontFamily: F.mono, fontSize: 14, color: C.inkLight, lineHeight: 20 },
  memberAddInput: {
    flex: 1, fontFamily: F.serif, fontSize: 14, fontStyle: 'italic', color: C.ink,
  },

  // Submit bar
  submitBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.divider, borderTopStyle: 'dashed',
    backgroundColor: C.bg,
  },
  submitSummary: { flex: 1 },
  submitHint: { fontFamily: F.mono, fontSize: 7.5, color: C.inkLight, letterSpacing: 1.2 },
  submitDetail: { fontFamily: F.serif, fontSize: 14, fontStyle: 'italic', color: C.ink, marginTop: 2 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 13, paddingHorizontal: 18,
    backgroundColor: C.stamp,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: F.serif, fontSize: 15, fontStyle: 'italic', color: C.surface },
});
