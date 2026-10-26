import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  CalendarDays,
} from 'lucide-react-native';
import {
  getCalendarEventsApi,
  createCalendarEventApi,
  deleteCalendarEventApi,
} from '../../services/circle-tools.service';
import { CalendarEventEntity } from '@circle/types';

const isLocationUrl = (loc?: string | null): boolean => {
  if (!loc) return false;
  return /(https?:\/\/[^\s]+|(?:meet\.google\.com|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps)\/[^\s]+)/i.test(loc);
};

const extractLocationUrl = (loc?: string | null): string | null => {
  if (!loc) return null;
  const match = loc.match(/(https?:\/\/[^\s]+|(?:meet\.google\.com|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps)\/[^\s]+)/i);
  if (!match) return null;
  return match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
};

interface MobileCalendarViewProps {
  circleId: string;
}

export const MobileCalendarView: React.FC<MobileCalendarViewProps> = ({ circleId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEventEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add event modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startHour, setStartHour] = useState('09:00');
  const [reminderMinutes, setReminderMinutes] = useState('15');

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await getCalendarEventsApi(circleId, month, year);
      setEvents(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải lịch hẹn');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [circleId, month, year]);

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const firstDayOfWeek = useMemo(
    () => new Date(year, month - 1, 1).getDay(),
    [year, month],
  );

  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month, 1));

  const handleCreateEvent = async () => {
    if (!title.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên sự kiện');
      return;
    }

    try {
      const [hour, min] = startHour.split(':').map((s) => parseInt(s, 10));
      const evDate = new Date(
        Date.UTC(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          hour || 9,
          min || 0,
        ),
      );

      let reminderTime: string | undefined = undefined;
      if (reminderMinutes !== 'none') {
        const mins = parseInt(reminderMinutes, 10);
        reminderTime = new Date(evDate.getTime() - mins * 60 * 1000).toISOString();
      }

      if (evDate.getTime() < Date.now() - 60000) {
        Alert.alert('Lỗi', 'Không thể tạo sự kiện trong quá khứ');
        return;
      }

      await createCalendarEventApi(circleId, {
        eventTitle: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startTime: evDate.toISOString(),
        reminderTime,
      });

      setTitle('');
      setLocation('');
      setDescription('');
      setIsAddModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadEvents();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo sự kiện');
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert('Hủy sự kiện', 'Bạn có chắc chắn muốn hủy sự kiện này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy sự kiện',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCalendarEventApi(circleId, eventId);
            loadEvents();
          } catch (err: any) {
            Alert.alert('Lỗi', err.message || 'Không thể hủy sự kiện');
          }
        },
      },
    ]);
  };

  const selectedDayEvents = useMemo(() => {
    return events.filter((ev) => {
      const evDate = new Date(ev.startTime);
      return (
        evDate.getDate() === selectedDate.getDate() &&
        evDate.getMonth() === selectedDate.getMonth() &&
        evDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [events, selectedDate]);

  return (
    <View style={styles.container}>
      {/* Month Navigator Header */}
      <View style={styles.header}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navArrow}>
            <ChevronLeft size={18} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            Tháng {month}, {year}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navArrow}>
            <ChevronRight size={18} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setIsAddModalOpen(true)}
        >
          <Plus size={14} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Tạo sự kiện</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14 }}>
        {/* Days of Week */}
        <View style={styles.weekdaysRow}>
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, i) => (
            <Text key={i} style={styles.weekdayText}>
              {d}
            </Text>
          ))}
        </View>

        {/* Days Grid */}
        <View style={styles.daysGrid}>
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.emptyDayCell} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isSelected =
              selectedDate.getDate() === dayNum &&
              selectedDate.getMonth() + 1 === month &&
              selectedDate.getFullYear() === year;

            const hasEvents = events.some((ev) => {
              const d = new Date(ev.startTime);
              return (
                d.getDate() === dayNum &&
                d.getMonth() + 1 === month &&
                d.getFullYear() === year
              );
            });

            return (
              <TouchableOpacity
                key={`day-${dayNum}`}
                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                onPress={() => {
                  setSelectedDate(new Date(year, month - 1, dayNum));
                  Haptics.selectionAsync();
                }}
              >
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                  {dayNum}
                </Text>
                {hasEvents && <View style={styles.eventDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Day Events Section */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>
            Sự kiện ngày {selectedDate.toLocaleDateString('vi-VN')} ({selectedDayEvents.length})
          </Text>

          {isLoading ? (
            <ActivityIndicator size="small" color="#64748B" style={{ marginTop: 20 }} />
          ) : selectedDayEvents.length > 0 ? (
            <View style={{ gap: 10, marginTop: 8 }}>
              {selectedDayEvents.map((ev) => (
                <View key={ev.id} style={styles.eventCard}>
                  <View style={styles.eventCardHeader}>
                    <Text style={styles.eventCardTitle}>{ev.eventTitle}</Text>
                    <TouchableOpacity onPress={() => handleDeleteEvent(ev.id)}>
                      <Trash2 size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.eventInfoRow}>
                    <Clock size={12} color="#0D9488" />
                    <Text style={styles.eventInfoText}>
                      {new Date(ev.startTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  {ev.location ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      disabled={!isLocationUrl(ev.location)}
                      onPress={() => {
                        const url = extractLocationUrl(ev.location);
                        if (url) {
                          Linking.openURL(url).catch(() => {});
                        }
                      }}
                      style={styles.eventInfoRow}
                    >
                      <MapPin size={12} color="#0D9488" />
                      <Text
                        style={[
                          styles.eventInfoText,
                          isLocationUrl(ev.location) && {
                            color: '#0284C7',
                            textDecorationLine: 'underline',
                          },
                        ]}
                      >
                        {ev.location}
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  {ev.reminderTime ? (
                    <View style={styles.eventInfoRow}>
                      <Bell size={12} color="#D97706" />
                      <Text style={[styles.eventInfoText, { color: '#D97706' }]}>
                        Nhắc nhở trước giờ hẹn
                      </Text>
                    </View>
                  ) : null}

                  {ev.description ? (
                    <Text style={styles.eventCardDesc}>{ev.description}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noEventsCard}>
              <CalendarDays size={32} color="#94A3B8" />
              <Text style={styles.noEventsText}>Không có lịch hẹn trong ngày này</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo Sự Kiện / Lịch Hẹn</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên sự kiện *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Họp đồ án, Ăn tối..."
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Địa điểm (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Thư viện, Quán Cafe..."
                placeholderTextColor="#94A3B8"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Giờ bắt đầu (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="09:00"
                placeholderTextColor="#94A3B8"
                value={startHour}
                onChangeText={setStartHour}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Chuẩn bị tài liệu hoặc ghi chú..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={2}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddModalOpen(false)}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateEvent}>
                <Text style={styles.submitText}>Lên lịch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navArrow: {
    padding: 4,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    width: 36,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: '#0F172A',
  },
  dayText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0D9488',
  },
  eventsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  eventInfoText: {
    fontSize: 11,
    color: '#64748B',
  },
  eventCardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  noEventsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  noEventsText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
