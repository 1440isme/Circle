import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  Sun,
  Moon,
  Laptop,
  Smartphone,
  Tablet,
  Shield,
  Globe,
  RefreshCw,
  LogOut,
  Check,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react-native';
import { SessionEntity } from '@circle/types';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import {
  useSessionsQuery,
  useRevokeSessionMutation,
  useRevokeOtherSessionsMutation,
} from '../../hooks/use-session-queries';
import { useEdgeSwipeDismiss } from '../../hooks/use-edge-swipe';

interface SystemSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  defaultTab?: 'general' | 'sessions';
}

export function SystemSettingsModal({
  visible,
  onClose,
  defaultTab = 'general',
}: SystemSettingsModalProps) {
  const { colors, theme, resolvedTheme, setTheme } = useThemeStore();
  const { locale, setLocale, t } = useLanguageStore();

  const edgePan = useEdgeSwipeDismiss({ onDismiss: onClose });

  const [activeTab, setActiveTab] = useState<'general' | 'sessions'>(defaultTab);

  const { data: sessions = [], isLoading, isRefetching, refetch } = useSessionsQuery();
  const revokeSessionMutation = useRevokeSessionMutation();
  const revokeOtherSessionsMutation = useRevokeOtherSessionsMutation();

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  const getDeviceIcon = (deviceType: SessionEntity['deviceType']) => {
    switch (deviceType) {
      case 'DESKTOP':
        return <Laptop size={18} color={colors.text} />;
      case 'MOBILE':
        return <Smartphone size={18} color={colors.text} />;
      case 'TABLET':
        return <Tablet size={18} color={colors.text} />;
      default:
        return <Shield size={18} color={colors.text} />;
    }
  };

  const formatSessionTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const handleRevokeSingle = (sessionId: string) => {
    Alert.alert(
      t.auth.revokeSession,
      t.auth.revokeSessionConfirm || 'Bạn có chắc chắn muốn đăng xuất thiết bị này không?',
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.auth.revokeSession,
          style: 'destructive',
          onPress: async () => {
            setRevokingId(sessionId);
            setErrorNotice(null);
            try {
              await revokeSessionMutation.mutateAsync(sessionId);
              setSuccessNotice(t.auth.revokeSessionSuccess);
              setTimeout(() => setSuccessNotice(null), 3000);
            } catch (err: any) {
              setErrorNotice(err?.message || t.auth.sessionNotFound);
            } finally {
              setRevokingId(null);
            }
          },
        },
      ],
    );
  };

  const handleRevokeAllOther = () => {
    Alert.alert(
      t.auth.revokeAllOtherSessions,
      t.auth.revokeAllOtherSessionsConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.auth.revokeAllOtherSessions,
          style: 'destructive',
          onPress: async () => {
            setErrorNotice(null);
            try {
              await revokeOtherSessionsMutation.mutateAsync();
              setSuccessNotice(t.auth.revokeAllOtherSuccess);
              setTimeout(() => setSuccessNotice(null), 3000);
            } catch (err: any) {
              setErrorNotice(err?.message || t.common.unknownError);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          {...edgePan.panHandlers}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
            },
          ]}
        >
          {/* Header: Clean Title only, No icon wrapper, Circular X button */}
          <View style={[styles.headerRow, { borderBottomColor: colors.hairline }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t.common.systemSettings}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.wash }]}
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Sub-tab segmented bar */}
          <View style={[styles.tabBar, { borderBottomColor: colors.hairline }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('general')}
              style={[
                styles.tabBtn,
                activeTab === 'general' && [styles.tabBtnActive, { backgroundColor: colors.wash }],
              ]}
            >
              <Globe
                size={16}
                color={activeTab === 'general' ? colors.primary : colors.subtle}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'general' ? colors.text : colors.subtle },
                  activeTab === 'general' && styles.tabBtnTextBold,
                ]}
              >
                {t.common.generalTab}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('sessions')}
              style={[
                styles.tabBtn,
                activeTab === 'sessions' && [styles.tabBtnActive, { backgroundColor: colors.wash }],
              ]}
            >
              <Laptop
                size={16}
                color={activeTab === 'sessions' ? colors.primary : colors.subtle}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'sessions' ? colors.text : colors.subtle },
                  activeTab === 'sessions' && styles.tabBtnTextBold,
                ]}
              >
                {t.common.sessionsTab}
              </Text>
              {sessions.length > 0 && (
                <View style={[styles.badgePill, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.badgePillText, { color: colors.onPrimary }]}>
                    {sessions.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Notices */}
            {successNotice && (
              <View style={[styles.noticeBox, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}40` }]}>
                <CheckCircle2 size={16} color={colors.success} />
                <Text style={[styles.noticeText, { color: colors.success }]}>
                  {successNotice}
                </Text>
              </View>
            )}
            {errorNotice && (
              <View style={[styles.noticeBox, { backgroundColor: `${colors.danger}15`, borderColor: `${colors.danger}40` }]}>
                <AlertTriangle size={16} color={colors.danger} />
                <Text style={[styles.noticeText, { color: colors.danger }]}>
                  {errorNotice}
                </Text>
              </View>
            )}

            {/* TAB 1: CÀI ĐẶT CHUNG (THEME & NGÔN NGỮ) */}
            {activeTab === 'general' && (
              <View style={styles.generalSection}>
                {/* Section 1: Chế độ giao diện */}
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>
                    {t.common.appearanceSection}
                  </Text>
                  <View
                    style={[
                      styles.segmentedContainer,
                      {
                        backgroundColor: colors.wash,
                        borderColor: colors.hairline,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setTheme('light')}
                      style={[
                        styles.segmentBtn,
                        theme === 'light' && [styles.segmentBtnActive, { backgroundColor: colors.surface, borderColor: colors.hairline }],
                      ]}
                    >
                      <Sun size={15} color={theme === 'light' ? colors.primary : colors.subtle} />
                      <Text
                        style={[
                          styles.segmentBtnText,
                          { color: theme === 'light' ? colors.text : colors.subtle },
                        ]}
                      >
                        {t.common.themeLight}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setTheme('dark')}
                      style={[
                        styles.segmentBtn,
                        theme === 'dark' && [styles.segmentBtnActive, { backgroundColor: colors.surface, borderColor: colors.hairline }],
                      ]}
                    >
                      <Moon size={15} color={theme === 'dark' ? colors.primary : colors.subtle} />
                      <Text
                        style={[
                          styles.segmentBtnText,
                          { color: theme === 'dark' ? colors.text : colors.subtle },
                        ]}
                      >
                        {t.common.themeDark}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setTheme('system')}
                      style={[
                        styles.segmentBtn,
                        theme === 'system' && [styles.segmentBtnActive, { backgroundColor: colors.surface, borderColor: colors.hairline }],
                      ]}
                    >
                      <Laptop size={15} color={theme === 'system' ? colors.primary : colors.subtle} />
                      <Text
                        style={[
                          styles.segmentBtnText,
                          { color: theme === 'system' ? colors.text : colors.subtle },
                        ]}
                      >
                        {t.common.themeSystem}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Section 2: Ngôn ngữ hiển thị */}
                <View style={[styles.sectionBlock, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline, paddingTop: 16 }]}>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>
                    {t.common.languageSection}
                  </Text>
                  <View
                    style={[
                      styles.segmentedContainer,
                      {
                        backgroundColor: colors.wash,
                        borderColor: colors.hairline,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setLocale('vi')}
                      style={[
                        styles.segmentBtn,
                        locale === 'vi' && [styles.segmentBtnActive, { backgroundColor: colors.surface, borderColor: colors.hairline }],
                      ]}
                    >
                      <Text style={styles.flagEmoji}>🇻🇳</Text>
                      <Text
                        style={[
                          styles.segmentBtnText,
                          { color: locale === 'vi' ? colors.text : colors.subtle },
                        ]}
                      >
                        Tiếng Việt
                      </Text>
                      {locale === 'vi' && <Check size={14} color={colors.primary} style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setLocale('en')}
                      style={[
                        styles.segmentBtn,
                        locale === 'en' && [styles.segmentBtnActive, { backgroundColor: colors.surface, borderColor: colors.hairline }],
                      ]}
                    >
                      <Text style={styles.flagEmoji}>🇬🇧</Text>
                      <Text
                        style={[
                          styles.segmentBtnText,
                          { color: locale === 'en' ? colors.text : colors.subtle },
                        ]}
                      >
                        English
                      </Text>
                      {locale === 'en' && <Check size={14} color={colors.primary} style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 2: PHIÊN ĐĂNG NHẬP (SESSIONS) */}
            {activeTab === 'sessions' && (
              <View style={styles.sessionsSection}>
                <View style={styles.sessionsHeaderRow}>
                  <Text style={[styles.sessionsSubtitle, { color: colors.subtle }]}>
                    {t.auth.sessionsSubtitle || 'Quản lý các thiết bị đang đăng nhập tài khoản của bạn'}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => refetch()}
                    disabled={isRefetching}
                    style={styles.refreshRow}
                  >
                    <RefreshCw size={13} color={colors.subtle} />
                    <Text style={[styles.refreshText, { color: colors.subtle }]}>
                      {isRefetching ? t.common.loading : 'Làm mới'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isLoading ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.subtle }]}>
                      {t.common.loading}
                    </Text>
                  </View>
                ) : sessions.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Shield size={28} color={colors.subtle} />
                    <Text style={[styles.emptyText, { color: colors.subtle }]}>
                      {t.auth.noOtherSessions}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.sessionList}>
                    {sessions.map((session, index) => {
                      const isCurrent = Boolean(session.isCurrent);
                      const isRevokingThis = revokingId === session.id;

                      return (
                        <View
                          key={session.id}
                          style={[
                            styles.sessionRow,
                            index > 0 && {
                              borderTopWidth: StyleSheet.hairlineWidth,
                              borderTopColor: colors.hairline,
                            },
                          ]}
                        >
                          <View style={styles.sessionLeft}>
                            {/* Device Icon directly without bounding box wrapper */}
                            {getDeviceIcon(session.deviceType)}
                            <View style={styles.sessionInfo}>
                              <View style={styles.sessionTitleRow}>
                                <Text
                                  numberOfLines={1}
                                  style={[styles.deviceName, { color: colors.text }]}
                                >
                                  {session.browser || session.deviceType || 'Device'} • {session.os || ''}
                                </Text>
                                {isCurrent && (
                                  <View style={[styles.currentBadge, { backgroundColor: `${colors.primary}18` }]}>
                                    <Text style={[styles.currentBadgeText, { color: colors.primary }]}>
                                      {t.auth.currentSession}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text style={[styles.sessionMeta, { color: colors.subtle }]}>
                                {session.ipAddress ? `${session.ipAddress} • ` : ''}
                                {formatSessionTime(session.createdAt)}
                              </Text>
                            </View>
                          </View>

                          {!isCurrent && (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleRevokeSingle(session.id)}
                              disabled={isRevokingThis || revokeSessionMutation.isPending}
                              style={[
                                styles.revokeBtn,
                                {
                                  borderColor: `${colors.danger}40`,
                                  backgroundColor: `${colors.danger}10`,
                                },
                              ]}
                            >
                              {isRevokingThis ? (
                                <ActivityIndicator size="small" color={colors.danger} />
                              ) : (
                                <Text style={[styles.revokeBtnText, { color: colors.danger }]}>
                                  {t.auth.revokeSession || 'Thu hồi'}
                                </Text>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}

                    {/* Revoke All Other Sessions Button */}
                    {otherSessions.length > 0 && (
                      <View style={[styles.revokeAllBox, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline }]}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={handleRevokeAllOther}
                          disabled={revokeOtherSessionsMutation.isPending}
                          style={[
                            styles.revokeAllBtn,
                            {
                              backgroundColor: `${colors.danger}15`,
                              borderColor: `${colors.danger}30`,
                            },
                          ]}
                        >
                          <LogOut size={16} color={colors.danger} />
                          <Text style={[styles.revokeAllBtnText, { color: colors.danger }]}>
                            {t.auth.revokeAllOtherSessions} ({otherSessions.length})
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tabBtnTextBold: {
    fontWeight: '700',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 2,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  generalSection: {
    gap: 18,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  segmentBtnActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  flagEmoji: {
    fontSize: 14,
  },
  sessionsSection: {
    gap: 14,
  },
  sessionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionsSubtitle: {
    fontSize: 12,
    flex: 1,
    paddingRight: 8,
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
  },
  sessionList: {
    gap: 0,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 10,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sessionInfo: {
    flex: 1,
    gap: 2,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  currentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sessionMeta: {
    fontSize: 11,
  },
  revokeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  revokeBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  revokeAllBox: {
    paddingTop: 16,
    marginTop: 6,
  },
  revokeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  revokeAllBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
