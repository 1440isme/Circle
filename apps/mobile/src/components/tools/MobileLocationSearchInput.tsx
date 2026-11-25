import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { MapPin, X, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { searchLocationsUnified, sanitizeLocationQuery, UnifiedLocationItem } from '@circle/shared';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';

interface MobileLocationSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectCoords?: (coords: { lat: number; lng: number; title: string; address?: string }) => void;
  placeholder?: string;
}

export const MobileLocationSearchInput: React.FC<MobileLocationSearchInputProps> = ({
  value,
  onChange,
  onSelectCoords,
  placeholder,
}) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { t } = useLanguageStore();

  const [suggestions, setSuggestions] = useState<UnifiedLocationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isUserTypingRef = useRef(false);

  useEffect(() => {
    if (!isUserTypingRef.current) return;

    const trimmed = (value || '').trim();
    if (
      !trimmed ||
      trimmed.length < 2 ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.includes('meet.google.com') ||
      trimmed.includes('google.com/maps')
    ) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocationsUnified(trimmed, { limit: 5 });
        if (isUserTypingRef.current) {
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = (item: UnifiedLocationItem) => {
    isUserTypingRef.current = false;
    const cleanName = sanitizeLocationQuery(item.name || item.display_name?.split(',')?.[0]);
    onChange(cleanName);
    setShowSuggestions(false);
    Keyboard.dismiss();
    Haptics.selectionAsync().catch(() => {});

    if (onSelectCoords && item.lat && item.lon) {
      onSelectCoords({
        lat: item.lat,
        lng: item.lon,
        title: cleanName,
        address: item.display_name,
      });
    }
  };

  const handleClear = () => {
    isUserTypingRef.current = false;
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
            borderColor: colors.hairline,
          },
        ]}
      >
        <Search size={14} color={colors.subtle} style={styles.searchIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder || t.collab.locationSearchPlaceholder}
          placeholderTextColor={colors.subtle}
          value={value}
          onChangeText={(text) => {
            isUserTypingRef.current = true;
            onChange(text);
          }}
          onFocus={() => {
            if (suggestions.length > 0 && isUserTypingRef.current) {
              setShowSuggestions(true);
            }
          }}
          returnKeyType="search"
          autoCorrect={false}
        />
        {isSearching && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        )}
        {Boolean(value) && !isSearching && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.clearBtn}
          >
            <X size={14} color={colors.subtle} />
          </TouchableOpacity>
        )}
      </View>

      {/* Autocomplete Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
              shadowColor: '#000',
            },
          ]}
        >
          <Text style={[styles.dropdownHeader, { color: colors.subtle }]}>
            {t.collab.searchPlaceHint || 'GỢI Ý TỪ BẢN ĐỒ'}
          </Text>
          {suggestions.map((item, idx) => (
            <TouchableOpacity
              key={`${item.lat}-${item.lon}-${idx}`}
              activeOpacity={0.7}
              style={[
                styles.suggestionItem,
                { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
              ]}
              onPress={() => handleSelect(item)}
            >
              <MapPin size={14} color={colors.primary} style={styles.pinIcon} />
              <View style={styles.itemTextCol}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemAddress, { color: colors.subtle }]} numberOfLines={1}>
                  {item.display_name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 50,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  loader: {
    marginLeft: 6,
  },
  clearBtn: {
    marginLeft: 6,
    padding: 2,
  },
  dropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    maxHeight: 220,
    overflow: 'hidden',
    zIndex: 100,
  },
  dropdownHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    textTransform: 'uppercase',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  pinIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  itemTextCol: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemAddress: {
    fontSize: 11,
    marginTop: 1,
  },
});
