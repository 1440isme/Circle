import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MapPin, Navigation, ExternalLink } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';

interface MobileChatLocationCardProps {
  lat: number;
  lng: number;
  title?: string;
  address?: string;
  isSenderMe?: boolean;
  senderTextColor?: string;
}

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

export const MobileChatLocationCard: React.FC<MobileChatLocationCardProps> = ({
  lat,
  lng,
  title,
  address,
  isSenderMe = false,
  senderTextColor,
}) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { t } = useLanguageStore();
  const [imageError, setImageError] = useState(false);

  const displayTitle = title || t.collab?.locationCardTitle || 'Điểm hẹn nhóm';
  const displayAddress = address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  const handleOpenMaps = () => {
    Haptics.selectionAsync();
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(() => {});
  };

  const textColor = isSenderMe ? senderTextColor || '#FFFFFF' : colors.text;
  const subtleColor = isSenderMe ? (senderTextColor || '#FFFFFF') : colors.subtle;

  const mapboxStyle = isDark ? 'dark-v11' : 'streets-v12';
  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyle}/static/pin-s-heart+10b981(${lng},${lat})/${lng},${lat},14,0/400x180@2x?access_token=${MAPBOX_TOKEN}`;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleOpenMaps}
      style={[styles.mapPreviewBox, { backgroundColor: '#0F172A' }]}
    >
      {!imageError ? (
        <Image
          source={{ uri: staticMapUrl }}
          style={StyleSheet.absoluteFill}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.pinCenterWrap}>
          <View style={[styles.pinBubble, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <Navigation size={15} color="#0F172A" style={{ transform: [{ rotate: '45deg' }] }} />
          </View>
          <View style={[styles.coordPill, { borderColor: `${colors.primary}40` }]}>
            <Text style={[styles.coordText, { color: colors.primary }]}>
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  mapPreviewBox: {
    width: 260,
    height: 130,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  mapBottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
  },
  overlayTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overlayAddressText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    paddingLeft: 16,
    marginTop: 1,
  },
  mapboxBadgeText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 8,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  pinCenterWrap: {
    alignItems: 'center',
  },
  pinBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  coordPill: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
  },
  coordText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
});
