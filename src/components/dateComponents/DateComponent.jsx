import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import DatePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const YEAR_PAGE_SIZE = 12;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getYearRangeStart = (year, minYear) => {
  const y = Math.max(minYear, year);
  return Math.floor((y - minYear) / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE + minYear;
};

const DateComponent = ({
  value = '',
  onChange,
  placeholder = 'Select Date',
  label,
  format = 'YYYY-MM-DD',
  minDate = new Date(1956, 0, 1),
  maxDate = new Date(2026, 11, 31),
  containerStyle,
  triggerStyle,
}) => {
  const [show, setShow] = useState(false);
  const [pickerStep, setPickerStep] = useState('year');
  const [yearRangeStart, setYearRangeStart] = useState(dayjs(minDate).year());
  const [calendarDate, setCalendarDate] = useState(dayjs(minDate).toDate());
  const [pickerYear, setPickerYear] = useState(dayjs(minDate).year());
  const [pickerMonth, setPickerMonth] = useState(dayjs(minDate).month());
  const [pickerDay, setPickerDay] = useState(dayjs(minDate).date());

  const isMonthYear = format === 'MMM YYYY';
  const isDayMonthYear = format === 'DD/MM/YYYY';

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const minYear = dayjs(minDate).year();
  const maxYear = dayjs(maxDate).year();
  const minD = dayjs(minDate);
  const maxD = dayjs(maxDate);

  const parseValue = (v) => {
    if (v == null) return null;
    if (v instanceof Date) return dayjs(v).isValid() ? v : null;
    const trimmed = String(v).trim();
    if (!trimmed) return null;

    const formats = ['DD/MM/YYYY', 'YYYY-MM-DD', 'MMM YYYY', 'MMM YY'];
    for (const fmt of formats) {
      const d = dayjs(trimmed, fmt, true);
      if (d.isValid()) return d.toDate();
    }
    const d = dayjs(trimmed);
    return d.isValid() ? d.toDate() : null;
  };

  const formatOutput = (date) => {
    const d = dayjs(date);
    if (!d.isValid()) return '';
    if (isMonthYear) return d.format('MMM YYYY');
    if (isDayMonthYear) return d.format('DD/MM/YYYY');
    return d.format('YYYY-MM-DD');
  };

  const getDisplayValue = () => {
    if (value == null || String(value).trim() === '') return '';
    const date = parseValue(value);
    if (!date) return String(value).trim();
    return formatOutput(date) || String(value).trim();
  };

  const displayValue = getDisplayValue();

  const yearRangeEnd = useMemo(
    () => Math.min(yearRangeStart + YEAR_PAGE_SIZE - 1, maxYear),
    [yearRangeStart, maxYear],
  );

  const yearsInRange = useMemo(() => {
    const years = [];
    for (let y = yearRangeStart; y <= yearRangeEnd; y += 1) {
      if (y >= minYear && y <= maxYear) years.push(y);
    }
    return years;
  }, [yearRangeStart, yearRangeEnd, minYear, maxYear]);

  const canPrevYearRange = yearRangeStart > minYear;
  const canNextYearRange = yearRangeEnd < maxYear;

  const goPrevYearRange = () => {
    setYearRangeStart((prev) => Math.max(minYear, prev - YEAR_PAGE_SIZE));
  };

  const goNextYearRange = () => {
    setYearRangeStart((prev) => {
      const next = prev + YEAR_PAGE_SIZE;
      const maxStart = Math.max(minYear, maxYear - YEAR_PAGE_SIZE + 1);
      return Math.min(next, maxStart);
    });
  };

  const openPicker = () => {
    const d = parseValue(value) || minDate || new Date();
    const dd = dayjs(d).isValid() ? dayjs(d) : dayjs(minDate);
    const clamped = dd.isBefore(minD, 'day')
      ? minD
      : dd.isAfter(maxD, 'day')
        ? maxD
        : dd;

    setPickerYear(clamped.year());
    setPickerMonth(clamped.month());
    setPickerDay(clamped.date());
    setCalendarDate(clamped.toDate());
    setYearRangeStart(getYearRangeStart(clamped.year(), minYear));

    if (isDayMonthYear) {
      setPickerStep(parseValue(value) ? 'day' : 'year');
    } else {
      setPickerStep('year');
    }
    setShow(true);
  };

  const closePicker = () => setShow(false);

  const handleDateChange = (params) => {
    if (params?.date) {
      onChange(formatOutput(params.date));
      closePicker();
    }
  };

  const syncCalendarFromParts = (year, month, day = pickerDay) => {
    let next = dayjs(new Date(year, month, 1));
    const daysInMonth = next.daysInMonth();
    const safeDay = Math.min(day, daysInMonth);
    next = next.date(safeDay);

    if (next.isBefore(minD, 'day')) next = minD;
    if (next.isAfter(maxD, 'day')) next = maxD;

    setPickerYear(next.year());
    setPickerMonth(next.month());
    setPickerDay(next.date());
    setCalendarDate(next.toDate());
  };

  const isMonthDisabled = (monthIndex) => {
    const monthStart = dayjs(new Date(pickerYear, monthIndex, 1));
    const monthEnd = monthStart.endOf('month');
    return monthEnd.isBefore(minD, 'day') || monthStart.isAfter(maxD, 'day');
  };

  const isDayDisabled = (day) => {
    const d = dayjs(new Date(pickerYear, pickerMonth, day));
    return d.isBefore(minD, 'day') || d.isAfter(maxD, 'day');
  };

  const handleSelectYear = (year) => {
    setPickerYear(year);
    setYearRangeStart(getYearRangeStart(year, minYear));
    setPickerStep('month');
  };

  const handleSelectMonth = (monthIndex) => {
    syncCalendarFromParts(pickerYear, monthIndex, pickerDay);
    setPickerStep('day');
  };

  const handleSelectDay = (day) => {
    if (isDayDisabled(day)) return;
    const selected = dayjs(new Date(pickerYear, pickerMonth, day));
    onChange(selected.format('DD/MM/YYYY'));
    closePicker();
  };

  const calendarWeeks = useMemo(() => {
    const first = dayjs(new Date(pickerYear, pickerMonth, 1));
    const daysInMonth = first.daysInMonth();
    const startOffset = first.day();
    const cells = [];
    for (let i = 0; i < startOffset; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [pickerYear, pickerMonth]);

  const goBackStep = () => {
    if (pickerStep === 'month') setPickerStep('year');
    else if (pickerStep === 'day') setPickerStep('month');
  };

  const getStepTitle = () => {
    if (isMonthYear) return 'Select Month & Year';
    if (!isDayMonthYear) return 'Select Date';
    if (pickerStep === 'year') return 'Select Year';
    if (pickerStep === 'month') return 'Select Month';
    return 'Select Day';
  };

  const getStepSubtitle = () => {
    if (!isDayMonthYear) return '';
    if (pickerStep === 'year') return 'Choose your birth year';
    if (pickerStep === 'month') return `Year: ${pickerYear}`;
    return `${MONTHS_FULL[pickerMonth]} ${pickerYear}`;
  };

  const renderYearRangePicker = () => (
    <View>
      <View style={styles.yearRow}>
        <TouchableOpacity
          style={[styles.navBtn, !canPrevYearRange && styles.navBtnDisabled]}
          onPress={goPrevYearRange}
          disabled={!canPrevYearRange}
        >
          <Text style={styles.navBtnTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.rangeCaption}>
          {yearRangeStart} – {yearRangeEnd}
        </Text>
        <TouchableOpacity
          style={[styles.navBtn, !canNextYearRange && styles.navBtnDisabled]}
          onPress={goNextYearRange}
          disabled={!canNextYearRange}
        >
          <Text style={styles.navBtnTxt}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.yearGrid}>
        {yearsInRange.map((y) => {
          const sel = y === pickerYear;
          return (
            <TouchableOpacity
              key={y}
              style={[styles.yearChip, sel && styles.yearChipSel]}
              onPress={() => handleSelectYear(y)}
              activeOpacity={0.85}
            >
              <Text style={[styles.yearChipTxt, sel && styles.yearChipTxtSel]}>{y}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderMonthGrid = (onSelect) => (
    <View style={styles.monthGrid}>
      {MONTHS.map((m, idx) => {
        const sel = idx === pickerMonth;
        const disabled = isMonthDisabled(idx);
        return (
          <TouchableOpacity
            key={m}
            style={[styles.monthChip, sel && styles.monthChipSel, disabled && styles.monthChipDisabled]}
            disabled={disabled}
            onPress={() => onSelect(idx)}
            activeOpacity={0.85}
          >
            <Text style={[styles.monthTxt, sel && styles.monthTxtSel]}>{m}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderDayGrid = () => (
    <View>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekdayTxt}>{w}</Text>
        ))}
      </View>
      {calendarWeeks.map((week, wi) => (
        <View key={`w-${wi}`} style={styles.weekRow}>
          {week.map((day, di) => {
            if (day == null) {
              return <View key={`e-${wi}-${di}`} style={styles.dayCell} />;
            }
            const sel = day === pickerDay;
            const disabled = isDayDisabled(day);
            return (
              <TouchableOpacity
                key={`d-${day}`}
                style={[
                  styles.dayCell,
                  styles.dayBtn,
                  sel && styles.dayBtnSel,
                  disabled && styles.dayBtnDisabled,
                ]}
                disabled={disabled}
                onPress={() => handleSelectDay(day)}
                activeOpacity={0.85}
              >
                <Text style={[styles.dayTxt, sel && styles.dayTxtSel, disabled && styles.dayTxtDisabled]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  const renderSteppedDobPicker = () => (
    <View>
      {pickerStep !== 'year' ? (
        <TouchableOpacity style={styles.backRow} onPress={goBackStep}>
          <Text style={styles.backTxt}>‹ Back</Text>
        </TouchableOpacity>
      ) : null}

      {pickerStep === 'year' && renderYearRangePicker()}
      {pickerStep === 'month' && renderMonthGrid(handleSelectMonth)}
      {pickerStep === 'day' && renderDayGrid()}

      {pickerStep === 'day' ? (
        <View style={styles.quickJumpRow}>
          <TouchableOpacity style={styles.quickJumpBtn} onPress={() => setPickerStep('year')}>
            <Text style={styles.quickJumpTxt}>Change year</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickJumpBtn} onPress={() => setPickerStep('month')}>
            <Text style={styles.quickJumpTxt}>Change month</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const renderMonthYearPicker = () => (
    <View>
      {renderYearRangePicker()}
      <Text style={styles.sectionHint}>Select month</Text>
      {renderMonthGrid((idx) => {
        setPickerMonth(idx);
        onChange(dayjs(new Date(pickerYear, idx, 1)).format('MMM YYYY'));
        closePicker();
      })}
    </View>
  );

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text allowFontScaling={false} style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.trigger, triggerStyle]}
        onPress={openPicker}
        activeOpacity={0.8}
      >
        <Text style={[styles.triggerTxt, !displayValue && styles.placeholder]}>
          {displayValue || placeholder}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>
      <Modal
        statusBarTranslucent
        visible={show}
        transparent
        animationType="slide"
        onRequestClose={closePicker}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closePicker}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{getStepTitle()}</Text>
            {getStepSubtitle() ? (
              <Text style={styles.modalSubtitle}>{getStepSubtitle()}</Text>
            ) : null}

            {isMonthYear ? (
              renderMonthYearPicker()
            ) : isDayMonthYear ? (
              renderSteppedDobPicker()
            ) : (
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                <DatePicker
                  mode="single"
                  date={calendarDate}
                  onChange={handleDateChange}
                  minDate={minDate}
                  maxDate={maxDate}
                  timePicker={false}
                  initialView="day"
                  navigationPosition="around"
                  hideHeader
                  style={styles.datePicker}
                />
              </ScrollView>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={closePicker}>
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
  triggerTxt: { fontSize: 15, color: '#1e293b', flex: 1 },
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
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  pickerScroll: { maxHeight: 360 },
  datePicker: { width: '100%', minHeight: 300 },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 14,
  },
  rangeCaption: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e293b',
    minWidth: 130,
    textAlign: 'center',
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F7F8FC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navBtnDisabled: { opacity: 0.35 },
  navBtnTxt: { fontSize: 24, fontWeight: '700', color: '#2563EB', lineHeight: 28 },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  yearChip: {
    width: '30%',
    maxWidth: 96,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F7F8FC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearChipSel: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  yearChipTxt: { fontSize: 15, fontWeight: '700', color: '#475569' },
  yearChipTxtSel: { color: '#fff' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  monthChip: {
    width: 72,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F7F8FC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthChipSel: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  monthChipDisabled: { opacity: 0.35 },
  monthTxt: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  monthTxtSel: { color: '#fff' },
  backRow: { marginBottom: 10 },
  backTxt: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayTxt: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnSel: { backgroundColor: '#2563EB' },
  dayBtnDisabled: { opacity: 0.3 },
  dayTxt: { fontSize: 14, fontWeight: '600', color: '#334155' },
  dayTxtSel: { color: '#fff', fontWeight: '700' },
  dayTxtDisabled: { color: '#94A3B8' },
  quickJumpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  quickJumpBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  quickJumpTxt: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  cancelBtn: { marginTop: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F7F8FC', alignItems: 'center' },
  cancelTxt: { fontSize: 14, fontWeight: '600', color: '#64748B' },
});

export default DateComponent;
