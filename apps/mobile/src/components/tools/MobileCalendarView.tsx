import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
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
  AlertCircle,
  Check,
  Search,
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

const cleanLocationText = (loc?: string | null): string => {
  if (!loc) return '';
  return loc.replace(/https?:\/\/[^\s]+/g, '').trim().replace(/\s*[-–—:]+\s*$/g, '').trim() || loc;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatDateTimeDisplay = (d: Date, h: number, m: number) => {
  const day = pad2(d.getDate());
  const month = pad2(d.getMonth() + 1);
  const year = d.getFullYear();
  const hour = pad2(h);
  const min = pad2(m);
  return `${day}/${month}/${year} ${hour}:${min}`;
};

const createDateFromParts = (d: Date, h: number, m: number): Date => {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ... 55

const REMINDER_OPTIONS = [
  { label: 'Không nhắc', value: 'none' },
  { label: '15 phút', value: '15' },
  { label: '30 phút', value: '30' },
  { label: '1 giờ', value: '60' },
  { label: '1 ngày', value: '1440' },
];

interface MobileCalendarViewProps {
  circleId: string;
}

export const MobileCalendarView: React.FC<MobileCalendarViewProps> = ({ circleId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEventEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add event modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState('15');

  // Start Date & Time
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);

  // End Date & Time (Optional)
  const [hasEndTime, setHasEndTime] = useState(false);
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState(0);

  // Location suggestions
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Date & Time Picker Modal
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end'>('start');
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date());
  const [pickerCalendarMode, setPickerCalendarMode] = useState<'days' | 'months' | 'years'>('days');
  const [pickerYearPageStart, setPickerYearPageStart] = useState<number>(() => {
    return Math.floor(new Date().getFullYear() / 12) * 12;
  });

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

  // Open Create Modal with smart defaults matching Web
  const handleOpenCreateModal = () => {
    setTitle('');
    setLocation('');
    setDescription('');
    setReminderMinutes('15');
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);

    const now = new Date();
    const isToday =
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();

    const isPast =
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime() <
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let targetDate = selectedDate;
    let targetHour = 9;
    let targetMinute = 0;

    if (isPast || isToday) {
      targetDate = now;
      targetHour = now.getHours() + 1;
      targetMinute = 0;
      if (targetHour >= 24) {
        targetDate = new Date(now.getTime() + 86400000);
        targetHour = 0;
      }
    }

    setStartDate(targetDate);
    setStartHour(targetHour);
    setStartMinute(targetMinute);

    setHasEndTime(false);
    setEndDate(targetDate);
    setEndHour((targetHour + 1) % 24);
    setEndMinute(targetMinute);

    setIsAddModalOpen(true);
  };

  // Location search autocomplete with Photon API
  useEffect(() => {
    const trimmed = location.trim();
    if (
      !trimmed ||
      trimmed.length < 2 ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.includes('meet.google.com') ||
      trimmed.includes('google.com/maps')
    ) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          trimmed,
        )}&lat=10.7769&lon=106.7009&limit=5`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const mapped = (data.features || []).map((f: any) => {
            const p = f.properties || {};
            const name = p.name || p.street || trimmed;
            const parts = [
              p.name,
              p.housenumber ? `Số ${p.housenumber}` : '',
              p.street,
              p.locality || p.district,
              p.city,
              p.country,
            ].filter(Boolean);
            const address = Array.from(new Set(parts)).join(', ');
            return {
              name,
              address: address || name,
              lat: f.geometry?.coordinates?.[1],
              lon: f.geometry?.coordinates?.[0],
            };
          });
          setLocationSuggestions(mapped);
          setShowLocationSuggestions(mapped.length > 0);
        }
      } catch (err) {
        console.warn('Mobile location search error:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [location]);

  const handleSelectLocation = (item: any) => {
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`;
    setLocation(`${item.name} - ${mapUrl}`);
    setShowLocationSuggestions(false);
    Haptics.selectionAsync();
  };

  // Form validation error matching Web & Backend
  const formValidationError = useMemo((): string | null => {
    if (!title.trim()) return 'Vui lòng nhập tên sự kiện';

    const start = createDateFromParts(startDate, startHour, startMinute);
    if (start.getTime() < Date.now() - 60000) {
      return 'Thời gian bắt đầu không thể ở trong quá khứ';
    }

    if (hasEndTime) {
      const end = createDateFromParts(endDate, endHour, endMinute);
      if (end.getTime() <= start.getTime()) {
        return 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu';
      }
    }

    return null;
  }, [title, startDate, startHour, startMinute, hasEndTime, endDate, endHour, endMinute]);

  const handleCreateEvent = async () => {
    if (formValidationError) {
      Alert.alert('Chưa hợp lệ', formValidationError);
      return;
    }

    try {
      setIsSubmitting(true);
      const evStart = createDateFromParts(startDate, startHour, startMinute);
      const evEnd = hasEndTime
        ? createDateFromParts(endDate, endHour, endMinute)
        : undefined;

      let reminderTime: string | undefined = undefined;
      if (reminderMinutes !== 'none') {
        const mins = parseInt(reminderMinutes, 10);
        reminderTime = new Date(evStart.getTime() - mins * 60 * 1000).toISOString();
      }

      await createCalendarEventApi(circleId, {
        eventTitle: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startTime: evStart.toISOString(),
        endTime: evEnd ? evEnd.toISOString() : undefined,
        reminderTime,
      });

      setIsAddModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadEvents();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo sự kiện');
    } finally {
      setIsSubmitting(false);
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

  const openPicker = (target: 'start' | 'end') => {
    Haptics.selectionAsync();
    setPickerTarget(target);
    const targetDate = target === 'start' ? startDate : endDate;
    setPickerCalendarMode('days');
    setPickerYearPageStart(Math.floor(targetDate.getFullYear() / 12) * 12);
    setPickerMonthDate(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
    setIsPickerOpen(true);
  };

  const handlePickerPrev = () => {
    Haptics.selectionAsync();
    if (pickerCalendarMode === 'days') {
      setPickerMonthDate(new Date(pickerYear, pickerMonth - 2, 1));
    } else if (pickerCalendarMode === 'months') {
      setPickerMonthDate(new Date(pickerYear - 1, pickerMonth - 1, 1));
    } else if (pickerCalendarMode === 'years') {
      setPickerYearPageStart((prev) => prev - 12);
    }
  };

  const handlePickerNext = () => {
    Haptics.selectionAsync();
    if (pickerCalendarMode === 'days') {
      setPickerMonthDate(new Date(pickerYear, pickerMonth, 1));
    } else if (pickerCalendarMode === 'months') {
      setPickerMonthDate(new Date(pickerYear + 1, pickerMonth - 1, 1));
    } else if (pickerCalendarMode === 'years') {
      setPickerYearPageStart((prev) => prev + 12);
    }
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

  // Picker Month calculations
  const pickerYear = pickerMonthDate.getFullYear();
  const pickerMonth = pickerMonthDate.getMonth() + 1;
  const pickerDaysInMonth = new Date(pickerYear, pickerMonth, 0).getDate();
  const pickerFirstDayOfWeek = new Date(pickerYear, pickerMonth - 1, 1).getDay();

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

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreateModal}>
          <Plus size={14} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Tạo sự kiện</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14 }}>
        {/* Days of Week */}
        <View style={styles.weekdaysRow}>
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, i) => (
            <Text key={i} style={[styles.weekdayText, i === 0 && { color: '#EF4444' }]}>
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
              {selectedDayEvents.map((ev) => {
                const startTimeStr = new Date(ev.startTime).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const endTimeStr = ev.endTime
                  ? new Date(ev.endTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : null;

                return (
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
                        {startTimeStr} {endTimeStr ? `– ${endTimeStr}` : ''}
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
                          {cleanLocationText(ev.location)}
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
                );
              })}
            </View>
          ) : (
            <View style={styles.noEventsCard}>
              <CalendarDays size={32} color="#94A3B8" />
              <Text style={styles.noEventsText}>Không có lịch hẹn trong ngày này</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Event Modal - Đầy đủ các trường và validation như Web */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lên Lịch Hẹn & Sự Kiện Nhóm</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 520 }}
            >
              {/* 1. Tên sự kiện */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tên sự kiện / Lịch hẹn *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: Họp đồ án tốt nghiệp, Ăn tối..."
                  placeholderTextColor="#94A3B8"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* 2. Địa điểm kèm Autocomplete */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Địa điểm (tùy chọn)</Text>
                <View style={styles.locationInputContainer}>
                  <MapPin size={15} color="#64748B" style={{ marginLeft: 10 }} />
                  <TextInput
                    style={[styles.input, { flex: 1, borderWidth: 0, paddingLeft: 8 }]}
                    placeholder="Tìm địa điểm trên bản đồ hoặc dán link Google Meet..."
                    placeholderTextColor="#94A3B8"
                    value={location}
                    onChangeText={setLocation}
                  />
                  {isSearchingLocation && (
                    <ActivityIndicator size="small" color="#64748B" style={{ marginRight: 10 }} />
                  )}
                  {location.length > 0 && !isSearchingLocation && (
                    <TouchableOpacity
                      onPress={() => {
                        setLocation('');
                        setLocationSuggestions([]);
                        setShowLocationSuggestions(false);
                      }}
                      style={{ padding: 8 }}
                    >
                      <X size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Dropdown gợi ý địa điểm */}
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <View style={styles.suggestionsDropdown}>
                    <Text style={styles.suggestionsHeader}>GỢI Ý TỪ BẢN ĐỒ</Text>
                    {locationSuggestions.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectLocation(item)}
                      >
                        <MapPin size={13} color="#E11D48" style={{ marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.suggestionName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.suggestionAddress} numberOfLines={1}>
                            {item.address}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* 3. Thời gian bắt đầu & kết thúc (dd/mm/yyyy HH:mm) */}
              <View style={styles.dateTimeGrid}>
                {/* Bắt đầu lúc * */}
                <View style={styles.dateTimeCol}>
                  <Text style={styles.label}>Bắt đầu lúc *</Text>
                  <TouchableOpacity
                    style={styles.pickerTriggerBtn}
                    activeOpacity={0.7}
                    onPress={() => openPicker('start')}
                  >
                    <Clock size={14} color="#0D9488" />
                    <Text style={styles.pickerTriggerText}>
                      {formatDateTimeDisplay(startDate, startHour, startMinute)}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Kết thúc (tùy chọn) */}
                <View style={styles.dateTimeCol}>
                  <View style={styles.endTimeLabelRow}>
                    <Text style={styles.label}>Kết thúc (tùy chọn)</Text>
                    {hasEndTime && (
                      <TouchableOpacity onPress={() => setHasEndTime(false)}>
                        <Text style={styles.removeEndTimeText}>Bỏ</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {hasEndTime ? (
                    <TouchableOpacity
                      style={styles.pickerTriggerBtn}
                      activeOpacity={0.7}
                      onPress={() => openPicker('end')}
                    >
                      <Clock size={14} color="#0D9488" />
                      <Text style={styles.pickerTriggerText}>
                        {formatDateTimeDisplay(endDate, endHour, endMinute)}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.pickerTriggerBtn, styles.pickerTriggerBtnEmpty]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setHasEndTime(true);
                        openPicker('end');
                      }}
                    >
                      <Plus size={13} color="#64748B" />
                      <Text style={styles.pickerTriggerEmptyText}>+ Thêm giờ kết thúc</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Banner cảnh báo lỗi Form */}
              {formValidationError && (
                <View style={styles.errorBanner}>
                  <AlertCircle size={14} color="#E11D48" />
                  <Text style={styles.errorBannerText}>{formValidationError}</Text>
                </View>
              )}

              {/* 4. Nhắc nhở trước */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nhắc nhở trước</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 6 }}>
                  {REMINDER_OPTIONS.map((opt) => {
                    const isSelected = reminderMinutes === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => {
                          setReminderMinutes(opt.value);
                          Haptics.selectionAsync();
                        }}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 5. Ghi chú nội dung */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ghi chú nội dung</Text>
                <TextInput
                  style={[styles.input, { height: 68, textAlignVertical: 'top' }]}
                  placeholder="Chi tiết công việc hoặc chuẩn bị..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (Boolean(formValidationError) || isSubmitting) && styles.submitBtnDisabled,
                ]}
                onPress={handleCreateEvent}
                disabled={Boolean(formValidationError) || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>Lên lịch ngay</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Date & 24h Time Picker Overlay nằm ngay trong Modal để tránh lỗi xung đột 2 Modal trên mobile */}
          {isPickerOpen && (
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerModalContent}>
                {/* Header */}
                <View style={styles.pickerModalHeader}>
                  <Text style={styles.pickerModalTitle}>
                    {pickerTarget === 'start' ? 'Thời gian bắt đầu' : 'Thời gian kết thúc'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsPickerOpen(false)}
                    style={{ padding: 4 }}
                  >
                    <X size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Preview formatted */}
                <View style={styles.pickerPreviewBox}>
                  <Clock size={15} color="#0D9488" />
                  <Text style={styles.pickerPreviewText}>
                    {pickerTarget === 'start'
                      ? formatDateTimeDisplay(startDate, startHour, startMinute)
                      : formatDateTimeDisplay(endDate, endHour, endMinute)}
                  </Text>
                </View>

                {/* Calendar Month & Year Navigation with interactive chips */}
                <View style={styles.pickerMonthNav}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setPickerCalendarMode(pickerCalendarMode === 'months' ? 'days' : 'months');
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.pickerHeaderChip,
                        pickerCalendarMode === 'months' && styles.pickerHeaderChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerHeaderChipText,
                          pickerCalendarMode === 'months' && styles.pickerHeaderChipTextActive,
                        ]}
                      >
                        Tháng {pickerMonth}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        if (pickerCalendarMode === 'years') {
                          setPickerCalendarMode('days');
                        } else {
                          setPickerYearPageStart(Math.floor(pickerYear / 12) * 12);
                          setPickerCalendarMode('years');
                        }
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.pickerHeaderChip,
                        pickerCalendarMode === 'years' && styles.pickerHeaderChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerHeaderChipText,
                          pickerCalendarMode === 'years' && styles.pickerHeaderChipTextActive,
                        ]}
                      >
                        {pickerCalendarMode === 'years'
                          ? `${pickerYearPageStart} - ${pickerYearPageStart + 11}`
                          : pickerYear}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TouchableOpacity onPress={handlePickerPrev} style={styles.navArrow}>
                      <ChevronLeft size={16} color="#1E293B" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handlePickerNext} style={styles.navArrow}>
                      <ChevronRight size={16} color="#1E293B" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* CHẾ ĐỘ 1: CHỌN NĂM (12 năm) */}
                {pickerCalendarMode === 'years' && (
                  <View style={styles.pickerGridContainer}>
                    <View style={styles.picker3ColsGrid}>
                      {Array.from({ length: 12 }, (_, i) => pickerYearPageStart + i).map((y) => {
                        const isSelectedYear = y === pickerYear;
                        return (
                          <TouchableOpacity
                            key={`y-${y}`}
                            style={[styles.pickerGridCell, isSelectedYear && styles.pickerGridCellActive]}
                            onPress={() => {
                              setPickerMonthDate(new Date(y, pickerMonth - 1, 1));
                              setPickerCalendarMode('months');
                              Haptics.selectionAsync();
                            }}
                          >
                            <Text
                              style={[styles.pickerGridCellText, isSelectedYear && styles.pickerGridCellTextActive]}
                            >
                              {y}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <TouchableOpacity
                      onPress={() => setPickerCalendarMode('days')}
                      style={{ paddingVertical: 4, alignItems: 'center' }}
                    >
                      <Text style={{ fontSize: 11, color: '#0D9488', fontWeight: '600' }}>
                        ← Quay lại chọn ngày
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* CHẾ ĐỘ 2: CHỌN THÁNG (12 tháng) */}
                {pickerCalendarMode === 'months' && (
                  <View style={styles.pickerGridContainer}>
                    <View style={styles.picker3ColsGrid}>
                      {Array.from({ length: 12 }, (_, i) => i).map((mIdx) => {
                        const isSelectedMonth = mIdx === pickerMonth - 1;
                        return (
                          <TouchableOpacity
                            key={`m-idx-${mIdx}`}
                            style={[styles.pickerGridCell, isSelectedMonth && styles.pickerGridCellActive]}
                            onPress={() => {
                              setPickerMonthDate(new Date(pickerYear, mIdx, 1));
                              setPickerCalendarMode('days');
                              Haptics.selectionAsync();
                            }}
                          >
                            <Text
                              style={[styles.pickerGridCellText, isSelectedMonth && styles.pickerGridCellTextActive]}
                            >
                              Tháng {mIdx + 1}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <TouchableOpacity
                      onPress={() => setPickerCalendarMode('days')}
                      style={{ paddingVertical: 4, alignItems: 'center' }}
                    >
                      <Text style={{ fontSize: 11, color: '#0D9488', fontWeight: '600' }}>
                        ← Quay lại chọn ngày
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* CHẾ ĐỘ 3: CHỌN NGÀY (Lưới ngày) */}
                {pickerCalendarMode === 'days' && (
                  <View>
                    {/* Weekday headers */}
                    <View style={styles.weekdaysRow}>
                      {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, i) => (
                        <Text
                          key={d}
                          style={[styles.weekdayText, { fontSize: 10 }, i === 0 && { color: '#EF4444' }]}
                        >
                          {d}
                        </Text>
                      ))}
                    </View>

                    {/* Day grid */}
                    <View style={styles.pickerDaysGrid}>
                      {Array.from({ length: pickerFirstDayOfWeek }).map((_, i) => (
                        <View key={`empty-p-${i}`} style={styles.emptyDayCell} />
                      ))}

                      {Array.from({ length: pickerDaysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const activeDate = pickerTarget === 'start' ? startDate : endDate;
                        const isSelected =
                          activeDate.getDate() === dayNum &&
                          activeDate.getMonth() + 1 === pickerMonth &&
                          activeDate.getFullYear() === pickerYear;

                        return (
                          <TouchableOpacity
                            key={`p-day-${dayNum}`}
                            style={[styles.pickerDayCell, isSelected && styles.pickerDayCellSelected]}
                            onPress={() => {
                              const newD = new Date(pickerYear, pickerMonth - 1, dayNum);
                              if (pickerTarget === 'start') {
                                setStartDate(newD);
                              } else {
                                setEndDate(newD);
                              }
                              Haptics.selectionAsync();
                            }}
                          >
                            <Text
                              style={[
                                styles.pickerDayText,
                                isSelected && styles.pickerDayTextSelected,
                              ]}
                            >
                              {dayNum}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* 24-Hour and Minute Selectors */}
                <View style={styles.timeSelectSection}>
                  <Text style={styles.timeSectionHeader}>Chọn giờ (24h) & phút:</Text>

                  {/* Hours chips scroll */}
                  <View style={styles.timeRowContainer}>
                    <Text style={styles.timeUnitLabel}>Giờ:</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 4 }}
                    >
                      {HOURS.map((h) => {
                        const activeH = pickerTarget === 'start' ? startHour : endHour;
                        const isSelected = activeH === h;
                        return (
                          <TouchableOpacity
                            key={`h-${h}`}
                            style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                            onPress={() => {
                              if (pickerTarget === 'start') setStartHour(h);
                              else setEndHour(h);
                              Haptics.selectionAsync();
                            }}
                          >
                            <Text
                              style={[
                                styles.timeChipText,
                                isSelected && styles.timeChipTextSelected,
                              ]}
                            >
                              {pad2(h)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Minutes chips scroll */}
                  <View style={styles.timeRowContainer}>
                    <Text style={styles.timeUnitLabel}>Phút:</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 4 }}
                    >
                      {MINUTES.map((m) => {
                        const activeM = pickerTarget === 'start' ? startMinute : endMinute;
                        const isSelected = activeM === m;
                        return (
                          <TouchableOpacity
                            key={`m-${m}`}
                            style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                            onPress={() => {
                              if (pickerTarget === 'start') setStartMinute(m);
                              else setEndMinute(m);
                              Haptics.selectionAsync();
                            }}
                          >
                            <Text
                              style={[
                                styles.timeChipText,
                                isSelected && styles.timeChipTextSelected,
                              ]}
                            >
                              {pad2(m)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>

                {/* Done button */}
                <TouchableOpacity
                  style={styles.pickerDoneBtn}
                  onPress={() => {
                    setIsPickerOpen(false);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.pickerDoneBtnText}>Xác nhận</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
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
    marginBottom: 6,
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
    fontWeight: '600',
    color: '#334155',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0D9488',
    position: 'absolute',
    bottom: 4,
  },
  eventsSection: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventInfoText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  eventCardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  noEventsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginTop: 8,
  },
  noEventsText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 12,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  suggestionsDropdown: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  suggestionsHeader: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  suggestionAddress: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  dateTimeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  dateTimeCol: {
    flex: 1,
  },
  endTimeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  removeEndTimeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
  },
  pickerTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#F8FAFC',
  },
  pickerTriggerBtnEmpty: {
    borderStyle: 'dashed',
    backgroundColor: '#F1F5F9',
  },
  pickerTriggerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  pickerTriggerEmptyText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFE4E6',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 11,
    color: '#E11D48',
    fontWeight: '600',
    flex: 1,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  chipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Picker Modal styles
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 20,
    padding: 16,
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerModalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 10,
  },
  pickerPreviewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  pickerHeaderChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  pickerHeaderChipActive: {
    backgroundColor: '#0F172A',
  },
  pickerHeaderChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerHeaderChipTextActive: {
    color: '#FFFFFF',
  },
  pickerGridContainer: {
    paddingVertical: 4,
  },
  picker3ColsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  pickerGridCell: {
    width: '31%',
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  pickerGridCellActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  pickerGridCellText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  pickerGridCellTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pickerDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 4,
  },
  pickerDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginVertical: 1,
  },
  pickerDayCellSelected: {
    backgroundColor: '#0F172A',
  },
  pickerDayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  pickerDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeSelectSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timeSectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  timeRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeUnitLabel: {
    width: 40,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  timeChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  timeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  timeChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pickerDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  pickerDoneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
