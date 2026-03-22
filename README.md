# Flexi Kiosk Dashboard

Flexi Kiosk is a comprehensive web-based kiosk solution designed for educational environments. It serves as a central hub for displaying vital school information, including announcements, events, schedules, and facility status. The system features a dynamic dashboard and a secure admin portal for real-time content management, powered by Firebase.

## 🚀 Key Features

### 🎙️ Advanced Voice Commands
The Flexi Kiosk features an integrated voice recognition system with fuzzy matching to handle natural speech and mispronunciations.
- **Navigation**: Use commands like "Next", "Previous", or "Close" to navigate through paginated content and pop-ups.
- **Information Inquiry**: Ask for "Announcements", "Events", "Teachers Availability", or "Highlights" to view detailed information.
- **Date & Time**: Say "Date" or "Today" to get the current date and time displayed instantly.
- **Interactive Calendar**: Use voice to filter the calendar by "Today", "Tomorrow", "Next Week", or even specific months like "January".
- **Power Control**: Voice-activated "Screen Off" and "Screen On" (Wake up) commands for energy management.
- **Help System**: Say "Help" to see a complete list of available voice commands.

### 📊 Dynamic Dashboard
- **Real-time Updates**: Instant display of school announcements and upcoming events.
- **Interactive Calendar**: A functional calendar that highlights dates with events or announcements.
- **Facility Status Tracking**: Real-time monitoring of school facilities (e.g., library, labs, gym).
- **Teachers Availability**: View current schedules and availability of faculty members.
- **Scrolling Ticker**: A ticker at the bottom for urgent messages and school-wide greetings.
- **Highlights Gallery**: An automated image slider showcasing recent school activities and achievements.

### 🔐 Secure Admin Portal
- **Content Management**: Add, edit, and delete announcements, events, and highlights.
- **Facility Control**: Update the status of school rooms and facilities.
- **Ticker Management**: Customize the scrolling ticker message.
- **Firebase Backend**: All data is securely stored and synced in real-time via Google Firebase Firestore.

### 🔌 Hardware & Power Management
- **ESP32 Integration**: Supports ESP32 with a PIR sensor for motion-based activation.
- **Power Efficiency**: Automatically dims or turns off the screen when no motion is detected for a specified period (15 seconds default).
- **Greeting on Wake**: The kiosk greets users ("Good Morning/Afternoon") when motion is detected.

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+).
- **Backend/Database**: Firebase Firestore.
- **Hardware**: ESP32, PIR Motion Sensor (Arduino/C++).
- **Voice Engine**: Web Speech API with custom Fuzzy Matching logic (Soundex & Levenshtein distance).
- **Hosting**: Vercel.

## 📸 Screenshots

<img width="766" height="918" alt="image" src="https://github.com/user-attachments/assets/ae751986-0b9d-4a00-ade1-7ad3e30f827c" />

<img width="766" height="918" alt="image" src="https://github.com/user-attachments/assets/4dc30679-a2f4-4130-be12-a28dbf460adc" />

## 🛠️ Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-repo/flexi-kiosk.git
   ```

2. **Firebase Configuration**:
   - Update `firebase-config.js` with your Firebase project credentials.
   - Ensure Firestore is enabled in your Firebase Console.

3. **Hardware Setup (Optional)**:
   - Flash the `esp32_pir.ino` file to your ESP32.
   - Connect the PIR sensor to Pin 27 (or your preferred pin).

4. **Local Development**:
   - Simply open `index.html` in your browser or use a live server extension.

---

© 2026 Flexi Kiosk System
