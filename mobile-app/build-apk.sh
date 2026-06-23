#!/bin/bash
# VOXIO Mobile App - Android APK Build Script

echo "=========================================="
echo "  VOXIO Mobile App - APK Builder"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
echo -e "\n${YELLOW}[1/5] Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "✅ Node.js: $(node -v)"

# Check Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java not found. Please install Java JDK 17${NC}"
    exit 1
fi
echo -e "✅ Java: $(java -version 2>&1 | head -1)"

# Check Android SDK
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo -e "${RED}❌ Android SDK not found. Please set ANDROID_HOME environment variable${NC}"
    echo "   Example: export ANDROID_HOME=/path/to/android-sdk"
    exit 1
fi
echo -e "✅ Android SDK: ${ANDROID_HOME:-$ANDROID_SDK_ROOT}"

# Check Gradle
if ! command -v gradle &> /dev/null; then
    echo -e "${YELLOW}⚠️  Gradle not found in PATH, will use wrapper${NC}"
fi

# Step 2: Install dependencies
echo -e "\n${YELLOW}[2/5] Installing npm dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install failed${NC}"
    exit 1
fi
echo -e "✅ Dependencies installed"

# Step 3: Create assets directory
echo -e "\n${YELLOW}[3/5] Preparing assets...${NC}"
mkdir -p android/app/src/main/assets
echo -e "✅ Assets directory ready"

# Step 4: Bundle JS
echo -e "\n${YELLOW}[4/5] Bundling JavaScript...${NC}"
npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file index.js \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Bundle failed${NC}"
    exit 1
fi
echo -e "✅ Bundle created"

# Step 5: Build APK
echo -e "\n${YELLOW}[5/5] Building APK...${NC}"
cd android

# Generate debug keystore if not exists
if [ ! -f "$HOME/.android/debug.keystore" ]; then
    echo "Generating debug keystore..."
    mkdir -p "$HOME/.android"
    keytool -genkeypair -v \
        -keystore "$HOME/.android/debug.keystore" \
        -storepass android \
        -alias androiddebugkey \
        -keypass android \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname "CN=Android Debug,O=Android,C=US" 2>/dev/null
fi

./gradlew assembleRelease

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

cd ..

# Check output
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo -e "\n${GREEN}=========================================="
    echo "  ✅ BUILD SUCCESSFUL!"
    echo "=========================================="
    echo "  APK: $APK_PATH"
    echo "  Size: $SIZE"
    echo "==========================================${NC}"
else
    echo -e "${RED}❌ APK not found at expected path${NC}"
    exit 1
fi
