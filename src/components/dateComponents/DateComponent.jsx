import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import DatePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const DateComponent = ({
  value = '',
  onChange,
  placeholder = 'Select Date',
  label,
  format = 'YYYY-MM-DD',
  minDate = new Date(1956, 0, 1),
  maxDate = new Date(2026, 11, 31),
  containerStyle,
}) => {
  const [show, setShow] = useState(false);
  const [pickerYear, setPickerYear] = useState(dayjs(minDate).year());
  const [pickerMonth, setPickerMonth] = useState(dayjs(minDate).month());
  const isMonthYear = format === 'MMM YYYY';

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const parseValue = (v) => {
    if (v == null) return null;
    if (v instanceof Date) return dayjs(v).isValid() ? v : null;
    const trimmed = String(v).trim();
    if (!trimmed) return null;
    let d = dayjs(trimmed, 'YYYY-MM-DD', true);
    if (d.isValid()) return d.toDate();
    d = dayjs(trimmed, 'MMM YYYY', true);
    if (d.isValid()) return d.toDate();
    d = dayjs(trimmed, 'MMM YY', true);
    if (d.isValid()) return d.toDate();
    d = dayjs(trimmed);
    return d.isValid() ? d.toDate() : null;
  };

  const getDisplayValue = () => {
    if (value == null || String(value).trim() === '') return '';
    const date = parseValue(value);
    if (!date) return String(value).trim();
    const d = dayjs(date);
    if (!d.isValid()) return String(value).trim();
    try {
      return format === 'MMM YYYY' ? d.format('MMM YYYY') : d.format('YYYY-MM-DD');
    } catch {
      return String(value).trim();
    }
  };

  const displayValue = getDisplayValue();

  const handleDateChange = (params) => {
    if (params?.date) {
      const formatted = isMonthYear
        ? dayjs(params.date).format('MMM YYYY')
        : dayjs(params.date).format('YYYY-MM-DD');
      onChange(formatted);
      setShow(false);
    }
  };

  const initialDate = parseValue(value) || minDate || new Date();
  const dateForPicker = (initialDate && dayjs(initialDate).isValid()) ? dayjs(initialDate).toDate() : new Date();
  const minYear = dayjs(minDate).year();
  const maxYear = dayjs(maxDate).year();

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text allowFontScaling={false} style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => {
          const d = parseValue(value) || minDate || new Date();
          const dd = dayjs(d);
          setPickerYear(dd.year());
          setPickerMonth(dd.month());
          setShow(true);
        }}
        activeOpacity={0.8}
      >
        <Text style={[styles.triggerTxt, !displayValue && styles.placeholder]}>
          {displayValue || placeholder}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>
      <Modal statusBarTranslucent={true} visible={show} transparent animationType="slide" onRequestClose={() => setShow(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShow(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Select {isMonthYear ? 'Month & Year' : 'Date'}</Text>
            {isMonthYear ? (
              <View>
                <View style={styles.yearRow}>
                  <TouchableOpacity
                    style={[styles.yearBtn, pickerYear <= minYear && styles.yearBtnDisabled]}
                    onPress={() => setPickerYear(y => Math.max(minYear, y - 1))}
                    disabled={pickerYear <= minYear}
                  >
                    <Text style={styles.yearBtnTxt}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.yearTxt}>{pickerYear}</Text>
                  <TouchableOpacity
                    style={[styles.yearBtn, pickerYear >= maxYear && styles.yearBtnDisabled]}
                    onPress={() => setPickerYear(y => Math.min(maxYear, y + 1))}
                    disabled={pickerYear >= maxYear}
                  >
                    <Text style={styles.yearBtnTxt}>›</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.monthGrid}>
                  {MONTHS.map((m, idx) => {
                    const sel = idx === pickerMonth;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.monthChip, sel && styles.monthChipSel]}
                        onPress={() => {
                          setPickerMonth(idx);
                          const selected = dayjs(new Date(pickerYear, idx, 1)).format('MMM YYYY');
                          onChange(selected);
                          setShow(false);
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.monthTxt, sel && styles.monthTxtSel]}>{m}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                <DatePicker
                  mode="single"
                  date={dateForPicker}
                  initialView="year"
                  year={dayjs(initialDate).year()}
                  month={dayjs(initialDate).month()}
                  onChange={handleDateChange}
                  minDate={minDate}
                  maxDate={maxDate}
                  timePicker={false}
                  yearContainerStyle={{ backgroundColor: '#fff' }}
                  style={styles.datePicker}
                />
              </ScrollView>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShow(false)}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#1e293b', marginBottom: 6 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  triggerTxt: { fontSize: 15, color: '#1e293b' },
  placeholder: { color: '#64748B' },
  arrow: { fontSize: 16, color: '#64748B' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 16 },
  pickerScroll: { maxHeight: 400 },
  datePicker: { width: '100%', height: 320 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 14 },
  yearBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F7F8FC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  yearBtnDisabled: { opacity: 0.4 },
  yearBtnTxt: { fontSize: 22, fontWeight: '700', color: '#2563EB' },
  yearTxt: { fontSize: 18, fontWeight: '800', color: '#1e293b', minWidth: 70, textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  monthChip: { width: 72, paddingVertical: 10, borderRadius: 14, backgroundColor: '#F7F8FC', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  monthChipSel: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  monthTxt: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  monthTxtSel: { color: '#fff' },
  cancelBtn: { marginTop: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F7F8FC', alignItems: 'center' },
  cancelTxt: { fontSize: 14, fontWeight: '600', color: '#64748B' },
});

export default DateComponent;
