import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
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
  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyle}/static/pin-s-heart+2563eb(${lng},${lat})/${lng},${lat},14,0/400x180@2x?access_token=${MAPBOX_TOKEN}`;

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isSenderMe ? 'rgba(0,0,0,0.15)' : 'rgba(56, 189, 248, 0.15)',
            },
          ]}
        >
          <MapPin size={16} color={isSenderMe ? textColor : '#0284C7'} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text numberOfLines={1} style={[styles.titleText, { color: textColor }]}>
            {displayTitle}
          </Text>
          <Text numberOfLines={1} style={[styles.addressText, { color: subtleColor, opacity: 0.85 }]}>
            {displayAddress}
          </Text>
        </View>
      </View>

      {/* Styled Mapbox Preview Canvas */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleOpenMaps}
        style={[styles.mapPreviewBox, { backgroundColor: '#0F172A' }]}
      >
        {!imageError ? (
          <Image
            source={{ uri: staticMapUrl }}
            style={styles.mapImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.pinCenterWrap}>
            <View style={styles.pinBubble}>
              <Navigation size={15} color="#0F172A" style={{ transform: [{ rotate: '45deg' }] }} />
            </View>
            <View style={styles.coordPill}>
              <Text style={styles.coordText}>
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </Text>
            </View>
          </View>
        )}
        <View style={styles.mapboxBadge}>
          <Text style={styles.mapboxBadgeText}>Mapbox</Text>
        </View>
      </TouchableOpacity>

      {/* Action Button: Open in Maps */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenMaps}
          style={[
            styles.openMapsBtn,
            {
              backgroundColor: isSenderMe ? 'rgba(255,255,255,0.2)' : '#0284C7',
            },
          ]}
        >
          <ExternalLink size={12} color="#FFFFFF" />
          <Text style={styles.openMapsBtnText}>
            {t.collab?.openInGoogleMaps || 'Mở chỉ đường Google Maps'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 220,
    maxWidth: 280,
    paddingVertical: 2,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  addressText: {
    fontSize: 11,
    marginTop: 1,
  },
  mapPreviewBox: {
    height: 100,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapboxBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  mapboxBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '600',
  },
  pinCenterWrap: {
    alignItems: 'center',
  },
  pinBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
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
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  coordText: {
    color: '#BAE6FD',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  actionRow: {
    alignItems: 'flex-end',
  },
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openMapsBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
