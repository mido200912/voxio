#!/bin/bash
# VOXIO Mobile App - iOS Build Script

echo "=========================================="
echo "  VOXIO Mobile App - iOS Builder"
echo "=========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
echo -e "\n${YELLOW}[1/4] Checking prerequisites...${NC}"

# Check if on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo -e "${RED}❌ iOS builds require macOS${NC}"
    exit 1
fi
echo -e "✅ macOS detected"

# Check Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode not found. Please install Xcode 15+${NC}"
    exit 1
fi
echo -e "✅ Xcode: $(xcodebuild -version | head -1)"

# Check CocoaPods
if ! command -v pod &> /dev/null; then
    echo -e "${RED}❌ CocoaPods not found. Run: sudo gem install cocoapods${NC}"
    exit 1
fi
echo -e "✅ CocoaPods: $(pod --version)"

# Step 2: Install dependencies
echo -e "\n${YELLOW}[2/4] Installing dependencies...${NC}"
npm install
cd ios && pod install && cd ..
echo -e "✅ Dependencies installed"

# Step 3: Build archive
echo -e "\n${YELLOW}[3/4] Building iOS archive...${NC}"
cd ios

xcodebuild -workspace Voxio.xcworkspace \
    -scheme Voxio \
    -configuration Release \
    -archivePath build/Voxio.xcarchive \
    -destination 'generic/platform=iPhone' \
    archive

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Archive failed${NC}"
    exit 1
fi
echo -e "✅ Archive created"

# Step 4: Export IPA
echo -e "\n${YELLOW}[4/4] Exporting IPA...${NC}"

cat > exportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>ad-hoc</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF

xcodebuild -exportArchive \
    -archivePath build/Voxio.xcarchive \
    -exportPath build \
    -exportOptionsPlist exportOptions.plist

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Export failed${NC}"
    exit 1
fi

cd ..

IPA_PATH="ios/build/Voxio.ipa"
if [ -f "$IPA_PATH" ]; then
    SIZE=$(du -h "$IPA_PATH" | cut -f1)
    echo -e "\n${GREEN}=========================================="
    echo "  ✅ BUILD SUCCESSFUL!"
    echo "=========================================="
    echo "  IPA: $IPA_PATH"
    echo "  Size: $SIZE"
    echo "==========================================${NC}"
else
    echo -e "${YELLOW}⚠️  Check ios/build/ for output${NC}"
fi
