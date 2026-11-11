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
import { Navigation } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';

interface MobileChatLocationCardProps {
  lat: number;
  lng: number;
  title?: string;
  address?: string;
  isSenderMe?: boolean;
  senderTextColor?: string;
}

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

function getSlippyTileUrl(lat: number, lng: number, isDark: boolean): string {
  const zoom = 15;
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom),
  );
  const styleName = isDark ? 'dark_all' : 'light_all';
  return `https://a.basemaps.cartocdn.com/${styleName}/${zoom}/${x}/${y}@2x.png`;
}

export const MobileChatLocationCard: React.FC<MobileChatLocationCardProps> = ({
  lat,
  lng,
}) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const [imageError, setImageError] = useState(false);

  const handleOpenMaps = () => {
    Haptics.selectionAsync();
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(() => {});
  };

  const mapboxStyle = isDark ? 'dark-v11' : 'streets-v12';
  const hasMapbox = Boolean(MAPBOX_TOKEN && MAPBOX_TOKEN.trim().length > 0);
  const staticMapUrl = hasMapbox
    ? `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyle}/static/pin-s-heart+10b981(${lng},${lat})/${lng},${lat},14,0/400x180@2x?access_token=${MAPBOX_TOKEN}`
    : getSlippyTileUrl(lat, lng, isDark);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleOpenMaps}
      style={[
        styles.mapPreviewBox,
        { backgroundColor: isDark ? '#0F172A' : colors.wash },
      ]}
    >
      {!imageError ? (
        <>
          <Image
            source={{ uri: staticMapUrl }}
            style={StyleSheet.absoluteFill}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
          {!hasMapbox && (
            <View style={styles.pinCenterWrap} pointerEvents="none">
              <View style={[styles.pinBubble, { backgroundColor: colors.primary, shadowColor: '#000' }]}>
                <Navigation
                  size={14}
                  color={colors.onPrimary}
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.pinCenterWrap}>
          <View style={[styles.pinBubble, { backgroundColor: colors.primary, shadowColor: '#000' }]}>
            <Navigation
              size={15}
              color={colors.onPrimary}
              style={{ transform: [{ rotate: '45deg' }] }}
            />
          </View>
          <View style={[styles.coordPill, { borderColor: `${colors.sage}50` }]}>
            <Text style={[styles.coordText, { color: colors.sage }]}>
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
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  coordPill: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
  },
  coordText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
});
