# Flexi Kiosk Dashboard

Flexi Kiosk is a comprehensive web-based kiosk solution designed for educational environments. It serves as a central hub for displaying vital school information, including announcements, events, schedules, and facility status. The system features a dynamic dashboard and a secure admin portal for real-time content management, powered by Firebase.

## 🚀 Key Features

- **Dynamic Dashboard**: Real-time display of school announcements, upcoming events, and a functional calendar.
- **Admin Portal**: A password-protected interface for administrators to add, edit, and delete announcements, events, highlights, and facility statuses.
- **Firebase Integration**: Uses Google Firebase (Firestore) for persistent, real-time data storage and synchronization across devices.
- **Facility Status Tracking**: Monitor and display the availability or status of various school facilities (e.g., library, labs, gym).
- **Interactive Elements**: Includes a scrolling ticker for urgent messages, an image slider for school highlights, and a voice greeting feature.
- **Hardware Integration**: Supports ESP32 with a PIR sensor for motion-based activation and power management.
- **Responsive Design**: Optimized for various screen sizes, including tablets and large kiosk displays.

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+).
- **Backend/Database**: Firebase Firestore.
- **Hardware**: ESP32, PIR Motion Sensor (Arduino/C++).
- **Hosting**: Vercel.

## 📸 Screenshots

*Upload your screenshots here to showcase the Flexi Kiosk interface.*

| Dashboard | Admin Portal |
| :---: | :---: |
| ![Dashboard Screenshot](https://via.placeholder.com/800x450?text=Dashboard+Screenshot) | ![Admin Portal Screenshot](https://via.placeholder.com/800x450?text=Admin+Portal+Screenshot) |

---

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
