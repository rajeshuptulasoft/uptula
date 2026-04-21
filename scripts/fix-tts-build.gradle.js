const fs = require('fs');
const path = require('path');

const ttsBuildGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-tts',
  'android',
  'build.gradle'
);

const voiceBuildGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-voice',
  'voice',
  'android',
  'build.gradle'
);

function fixBuildGradle(buildGradlePath, packageName) {
  if (fs.existsSync(buildGradlePath)) {
    let content = fs.readFileSync(buildGradlePath, 'utf8');
    
    let modified = false;
    
    // Replace jcenter() with mavenCentral()
    if (content.includes('jcenter()')) {
      content = content.replace(/jcenter\(\)/g, 'mavenCentral()');
      modified = true;
    }
    
    // For voice library, set compileSdkVersion to 36
    if (packageName === 'voice') {
      if (content.includes('compileSdkVersion rootProject.hasProperty(\'compileSdkVersion\') ? rootProject.compileSdkVersion : DEFAULT_COMPILE_SDK_VERSION')) {
        content = content.replace(
          'compileSdkVersion rootProject.hasProperty(\'compileSdkVersion\') ? rootProject.compileSdkVersion : DEFAULT_COMPILE_SDK_VERSION',
          'compileSdkVersion 36'
        );
        modified = true;
      }
      // Also set targetSdkVersion
      if (content.includes('targetSdkVersion rootProject.hasProperty(\'targetSdkVersion\') ? rootProject.targetSdkVersion : DEFAULT_TARGET_SDK_VERSION')) {
        content = content.replace(
          'targetSdkVersion rootProject.hasProperty(\'targetSdkVersion\') ? rootProject.targetSdkVersion : DEFAULT_TARGET_SDK_VERSION',
          'targetSdkVersion 36'
        );
        modified = true;
      }
      // Set buildToolsVersion
      if (content.includes('buildToolsVersion rootProject.hasProperty(\'buildToolsVersion\') ? rootProject.buildToolsVersion : DEFAULT_BUILD_TOOLS_VERSION')) {
        content = content.replace(
          'buildToolsVersion rootProject.hasProperty(\'buildToolsVersion\') ? rootProject.buildToolsVersion : DEFAULT_BUILD_TOOLS_VERSION',
          'buildToolsVersion "36.0.0"'
        );
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(buildGradlePath, content, 'utf8');
      console.log(`✅ Fixed ${packageName} build.gradle`);
    } else {
      console.log(`✅ ${packageName} build.gradle is already fixed`);
    }
  } else {
    console.log(`⚠️  ${packageName} build.gradle not found - package may not be installed`);
  }
}

fixBuildGradle(ttsBuildGradlePath, 'react-native-tts');
fixBuildGradle(voiceBuildGradlePath, 'voice');
