import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ToastMessage } from './ToastMessage';
import { BRANDCOLOR, WHITE, BLACK } from '../../constant/color';
import { FIRASANS, FIRASANSSEMIBOLD } from '../../constant/fontPath';
import { HEIGHT, WIDTH } from '../../constant/config';
import { INDIAN_LANGUAGES } from '../../i18n/languages';
import { changeAndSaveLanguage } from '../../i18n';

export const ChangeLanguageModal = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const [toast, setToast] = useState({ type: '', msg: '', visible: false });
  const [switching, setSwitching] = useState(false);

  const currentCode = i18n.language?.split('-')[0] || 'en';

  const handleSelect = useCallback(async (code) => {
    if (switching || code === currentCode) return;
    setSwitching(true);
    try {
      const ok = await changeAndSaveLanguage(code);
      if (ok) {
        setToast({
          type: 'success',
          msg: t('common.languageChanged'),
          visible: true,
        });
        setTimeout(() => {
          setToast((p) => ({ ...p, visible: false }));
          onClose?.();
        }, 600);
      }
    } finally {
      setSwitching(false);
    }
  }, [onClose, t, switching, currentCode]);

  const renderItem = ({ item }) => {
    const isSelected = item.code === currentCode;
    return (
      <TouchableOpacity
        style={[styles.langRow, isSelected && styles.langRowSelected]}
        onPress={() => handleSelect(item.code)}
        activeOpacity={0.75}
        disabled={switching}
      >
        <View style={styles.langTextWrap}>
          <Text style={styles.langNative}>{item.nativeName}</Text>
          <Text style={styles.langEnglish}>{item.englishName}</Text>
        </View>
        {isSelected ? (
          <MaterialCommunityIcons name="check-circle" size={22} color={BRANDCOLOR} />
        ) : (
          <MaterialCommunityIcons name="circle-outline" size={22} color="#CCC" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('language.title')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>{t('language.subtitle')}</Text>
          {(switching || i18n.isTranslating) && (
            <View style={styles.translatingRow}>
              <ActivityIndicator size="small" color={BRANDCOLOR} />
              <Text style={styles.translatingText}>{t('common.loading')}</Text>
            </View>
          )}
          <Text style={styles.current}>
            {t('language.current')}: {INDIAN_LANGUAGES.find((l) => l.code === currentCode)?.nativeName || 'English'}
          </Text>
          <FlatList
            data={INDIAN_LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
      {toast.visible ? (
        <ToastMessage
          type={toast.type}
          message={toast.msg}
          visible={toast.visible}
          setVisible={({ visible: v }) => setToast((p) => ({ ...p, visible: v }))}
          bacgroundColor="green"
          textColor={WHITE}
          duration={2000}
        />
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: WIDTH * 0.05,
  },
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: '100%',
    maxHeight: HEIGHT * 0.75,
    backgroundColor: WHITE,
    borderRadius: 14,
    zIndex: 1,
    paddingTop: HEIGHT * 0.02,
    paddingHorizontal: WIDTH * 0.04,
    paddingBottom: HEIGHT * 0.015,
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: HEIGHT * 0.008,
  },
  title: {
    fontSize: HEIGHT * 0.02,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    flex: 1,
    paddingRight: 8,
  },
  subtitle: {
    fontSize: HEIGHT * 0.013,
    fontFamily: FIRASANS,
    color: '#666',
    lineHeight: HEIGHT * 0.019,
    marginBottom: HEIGHT * 0.008,
  },
  current: {
    fontSize: HEIGHT * 0.013,
    fontFamily: FIRASANSSEMIBOLD,
    color: BRANDCOLOR,
    marginBottom: HEIGHT * 0.012,
  },
  translatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: HEIGHT * 0.01,
  },
  translatingText: {
    fontSize: HEIGHT * 0.013,
    fontFamily: FIRASANS,
    color: '#666',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: HEIGHT * 0.01,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    paddingVertical: HEIGHT * 0.014,
    paddingHorizontal: WIDTH * 0.035,
    marginBottom: HEIGHT * 0.008,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  langRowSelected: {
    borderColor: BRANDCOLOR,
    backgroundColor: '#F0FBF7',
  },
  langTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  langNative: {
    fontSize: HEIGHT * 0.016,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
  },
  langEnglish: {
    fontSize: HEIGHT * 0.012,
    fontFamily: FIRASANS,
    color: '#666',
    marginTop: 2,
  },
});
