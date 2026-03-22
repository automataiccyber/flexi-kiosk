# Flexi Kiosk - Web App Dashboard

A comprehensive web-based kiosk solution designed for educational environments that helps administrators manage and display school announcements, events, and facility status with real-time updates and voice commands.

## �️ App Overview

Flexi Kiosk is a web application designed to provide an interactive and dynamic dashboard for educational institutions. It features a dual-interface system: a public-facing dashboard for real-time information display and a secure admin portal for content management. The app integrates with Firebase for real-time synchronization and supports hardware-based motion detection via ESP32.

## ✨ Key Features

### 🎙️ Voice Interaction
- **Advanced Voice Commands**: Navigate the dashboard and query information using natural speech.
- **Fuzzy Matching**: Custom logic to handle mispronunciations and natural speech variations.
- **Contextual Responses**: Interactive pop-ups for announcements, events, and schedules triggered by voice.
- **Power Control**: Voice-activated "Screen Off" and "Wake up" commands for energy management.

### 📊 Dashboard & Display
- **Real-time Announcements**: Instant display of school updates with priority pinning.
- **Interactive Calendar**: Full-screen calendar with event highlighting and month-by-month navigation.
- **Facility Tracking**: Monitor and display the status of school rooms (e.g., Library, Gym, Labs).
- **Scrolling Ticker**: Bottom ticker for urgent alerts and general school-wide messages.
- **Highlights Gallery**: Automated image slider showcasing recent school activities and achievements.

### 🔐 Admin Management
- **Content Control**: Comprehensive tools to add, edit, and delete announcements, events, and highlights.
- **Facility Status**: Real-time room status updates via the admin interface.
- **Ticker Customization**: Easily update the scrolling message for the entire system.
- **Security**: Secure access to management tools and real-time database syncing.

### 🔌 Hardware Integration
- **Motion Activation**: ESP32 PIR sensor support for automatic screen power management.
- **Smart Greeting**: The kiosk detects presence and greets users ("Good Morning/Afternoon").
- **Energy Efficiency**: Automatically dims or turns off the screen when no motion is detected for a specified period.

## 🛠️ Technical Stack

### Core Technologies
- **Language**: JavaScript (ES6+).
- **Frontend**: HTML5, CSS3.
- **Backend/Database**: Firebase Firestore.
- **Hardware**: ESP32, PIR Motion Sensor (Arduino/C++).

### Key Dependencies
- **Firebase SDK**: Authentication and Firestore Real-time Database.
- **Web Speech API**: Voice recognition and synthesis (TTS).
- **Vercel**: Deployment and hosting.

### Architecture
- **Dashboard View**: Main interactive display for public information.
- **Admin Portal**: Multi-page management interface (admin.html, events.html, etc.).
- **Firebase Config**: Centralized configuration for cloud services.
- **Fuzzy Logic Engine**: Custom Soundex and Levenshtein distance implementation for voice commands.

## � Project Structure

```
flexi-kiosk-main/
├── admin.html          # Admin Portal Main Page
├── dashboard.html      # Public Kiosk Dashboard
├── index.html          # Landing Page (Selection)
├── events.html         # Event Management (Admin)
├── facility.html       # Facility Status Management (Admin)
├── highlights.html     # Highlights Gallery Management (Admin)
├── ticker.html         # Scrolling Ticker Management (Admin)
├── firebase-config.js  # Firebase Project Configuration
├── script.js           # Core Application Logic & Voice Engine
├── style.css           # Global Styles
├── dashboard-custom.css# Dashboard Specific Styling
├── backup.css          # Fallback Layout Styles
├── backup.html         # Fallback Dashboard View
├── esp32_pir.ino       # Hardware Integration Firmware (C++)
└── vercel.json         # Vercel Deployment Configuration
```

## 🚀 Getting Started

### Prerequisites
- Modern Web Browser (Chrome recommended for Web Speech API).
- Firebase Project with Firestore enabled.
- ESP32 Development Board (Optional, for motion sensing).
- Vercel account (Optional, for hosting).

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd flexi-kiosk-main
   ```

2. **Set up Firebase**
   - Create a new Firebase project in the Console.
   - Enable Firestore Database.
   - Update `firebase-config.js` with your specific API Key and Project ID.

3. **Hardware Setup (Optional)**
   - Open `esp32_pir.ino` in Arduino IDE.
   - Update `WIFI_SSID` and `WIFI_PASSWORD`.
   - Update `PROJECT_ID` and `API_KEY` to match your Firebase config.
   - Flash to your ESP32 board.

4. **Local Development**
   - Simply open `index.html` in your browser.
   - For a better experience, use a live server extension (e.g., Live Server in VS Code).

### Configuration

#### Firebase Setup
1. Enable Firestore and set up the following collections: `announcements`, `events`, `highlights`, `config`, `rooms`, `schedules`, `teachers`, `logs`.
2. Configure security rules to allow read/write access for authorized admin operations.

#### Voice Commands
The app uses the Web Speech API. Ensure your browser has permission to access the microphone. The command engine uses fuzzy matching for better reliability in noisy environments.

## 🔧 Features in Detail

### Advanced Voice Recognition
- **Model**: Custom fuzzy matching engine based on Soundex (phonetic matching) and Levenshtein distance (edit distance).
- **Intents**: Classified into navigation, inquiry, power, and help intents.
- **Failsafe**: If a command isn't recognized, the system provides helpful feedback or shows the command list.

### Hardware-Software Sync
- **Motion Sensor**: The ESP32 sends a PATCH request to Firestore when motion is detected.
- **Power State**: The web app listens for changes in the `sensors/pir` document to dim/wake the screen.
- **Persistence**: Power states are synced across all connected dashboard instances.

### Content Management
- **Image Compression**: Automatic client-side image compression before uploading to save Firestore bandwidth.
- **Paging System**: Large lists of announcements or events are automatically paginated for clarity.

## 📱 Screenshots

<img width="767" height="920" alt="image" src="https://github.com/user-attachments/assets/a050390f-8ec7-47e3-a82c-e5a40192ec72" />

<img width="765" height="919" alt="image" src="https://github.com/user-attachments/assets/6e82ca89-972a-4fec-bb67-4056268221ba" />

<img width="766" height="920" alt="image" src="https://github.com/user-attachments/assets/416ebaec-4f74-4c16-a135-94f8acc3008e" />

<img width="763" height="921" alt="image" src="https://github.com/user-attachments/assets/b705cb7a-4e24-480d-88ef-01e384e14c8c" />

<img width="767" height="919" alt="image" src="https://github.com/user-attachments/assets/df759abf-ad19-4b88-a9c2-9a7542176d10" />

<img width="767" height="918" alt="image" src="https://github.com/user-attachments/assets/27a4a1d5-07ce-46c6-8db3-6c874210e37c" />

## 🔒 Permissions

The app requires the following browser permissions:
- `MICROPHONE`: For voice command recognition.
- `STORAGE`: For temporary session management.

## 🧪 Testing

### Manual Testing
- Open the Dashboard and say "Help" to test voice recognition.
- Add an announcement in the Admin Portal and verify it appears on the Dashboard instantly.
- Test the ESP32 connection by monitoring the `sensors/pir` collection in Firebase.

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Contact

For support or inquiries:
- **Email**: lieldarrenfajutagana@gmail.com
- **Developer**: Liel Darren Fajutagana

## 🔄 Version History

- **v1.0**: Initial release
  - Core Dashboard and Admin functionality
  - Firebase Firestore integration
  - Advanced Voice Command Engine
  - ESP32 PIR Hardware support

## 🤝 Contributing

This is a proprietary application. For feature requests or bug reports, please contact the developer.

---

**Flexi Kiosk** - Your interactive solution for real-time school information and management.
