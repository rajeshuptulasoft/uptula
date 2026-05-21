/**
 * Profile completion weights (total 100%):
 * - Registration basics (name, email, phone): 10%
 * - Profile picture: 10%
 * - Personal details (gender, dob, address): 10%
 * - Career preferences: 15%
 * - Preferred job role (slogan): 5%
 * - Portfolio & other: 5%
 * - Resume: 10%
 * - Employment history: 10%
 * - Projects: 5%
 * - Certifications: 5%
 * - Education: 10%
 * - Skills: 10%
 * - Languages: 5%
 */

const isFieldFilled = (field) => {
  if (!field) return false;
  const strValue = String(field).trim();
  return strValue !== '' && strValue !== 'N/A';
};

const addBucket = (percentageRef, weight, fields) => {
  const list = (fields || []).filter((f) => f !== undefined && f !== null);
  if (list.length === 0) return percentageRef;
  const filled = list.filter(isFieldFilled).length;
  return percentageRef + (filled / list.length) * weight;
};

const hasArrayEntry = (items, checkFn) =>
  Array.isArray(items) && items.some((item) => checkFn(item));

export const calculateCompletionPercentage = ({
  name,
  email,
  phone,
  address,
  gender,
  dob,
  profilePicture,
  preferredLocation,
  currentSalary,
  expectedSalary,
  noticePeriod,
  bio,
  slogan,
  linkedin,
  github,
  portfolio,
  others,
  file,
  resumeUrl,
  resume,
  experienceItems = [],
  projectItems = [],
  educationItems = [],
  certificationItems = [],
  keySkills = [],
  languages = [],
}) => {
  let percentage = 0;

  // Registration basics — 10% (filled at signup: name, email, mobile)
  percentage = addBucket(percentage, 10, [name, email, phone]);

  // Profile picture — 10%
  const hasPicture =
    profilePicture &&
    (profilePicture?.uri
      ? String(profilePicture.uri).trim() !== ''
      : typeof profilePicture === 'string' && String(profilePicture).trim() !== '');
  if (hasPicture) percentage += 10;

  // Personal details — 10%
  percentage = addBucket(percentage, 10, [gender, dob, address]);

  // Career preferences — 15%
  percentage = addBucket(percentage, 15, [
    preferredLocation,
    currentSalary,
    expectedSalary,
    noticePeriod,
    bio,
  ]);

  // Preferred job role — 5%
  if (isFieldFilled(slogan)) percentage += 5;

  // Portfolio & other — 5%
  percentage = addBucket(percentage, 5, [linkedin, github, portfolio, others]);

  // Resume — 10%
  const hasResume =
    (file && file.uri && String(file.uri).trim() !== '') ||
    (resumeUrl && String(resumeUrl).trim() !== '') ||
    (resume && String(resume).trim() !== '');
  if (hasResume) percentage += 10;

  // Employment history — 10%
  if (hasArrayEntry(experienceItems, (exp) => isFieldFilled(exp?.companyName))) {
    percentage += 10;
  }

  // Projects — 5%
  if (
    hasArrayEntry(projectItems, (p) =>
      isFieldFilled(p?.projectName || p?.name || p?.title)
    )
  ) {
    percentage += 5;
  }

  // Certifications — 5%
  if (hasArrayEntry(certificationItems, (cert) => isFieldFilled(cert?.name))) {
    percentage += 5;
  }

  // Education — 10%
  if (hasArrayEntry(educationItems, (edu) => isFieldFilled(edu?.degree))) {
    percentage += 10;
  }

  // Skills — 10%
  if (Array.isArray(keySkills) && keySkills.length > 0) percentage += 10;

  // Languages — 5%
  if (Array.isArray(languages) && languages.length > 0) percentage += 5;

  return Math.min(Math.round(percentage), 100);
};
