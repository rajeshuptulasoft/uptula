/** Indian languages — ISO 639-1 / BCP-47 codes used by the app */
export const INDIAN_LANGUAGES = [
  { code: 'en', englishName: 'English', nativeName: 'English' },
  { code: 'hi', englishName: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'or', englishName: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'bn', englishName: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', englishName: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', englishName: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', englishName: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', englishName: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', englishName: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', englishName: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', englishName: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'as', englishName: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ur', englishName: 'Urdu', nativeName: 'اردو' },
  { code: 'sd', englishName: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'kok', englishName: 'Konkani', nativeName: 'कोंकणी' },
  { code: 'mai', englishName: 'Maithili', nativeName: 'मैथिली' },
  { code: 'mni', englishName: 'Manipuri', nativeName: 'মৈতৈলোন্' },
  { code: 'ne', englishName: 'Nepali', nativeName: 'नेपाली' },
  { code: 'ks', englishName: 'Kashmiri', nativeName: 'कॉशुर' },
  { code: 'doi', englishName: 'Dogri', nativeName: 'डोगरी' },
  { code: 'sa', englishName: 'Sanskrit', nativeName: 'संस्कृतम्' },
  { code: 'sat', englishName: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'brx', englishName: 'Bodo', nativeName: 'बड़ो' },
];

export const getLanguageLabel = (code) => {
  const lang = INDIAN_LANGUAGES.find((l) => l.code === code);
  return lang ? `${lang.nativeName} (${lang.englishName})` : code;
};
