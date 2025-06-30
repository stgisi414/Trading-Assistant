
# Firebase Setup Instructions

To enable Google OAuth authentication and cloud data persistence, you'll need to set up a Firebase project.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "signatex-trading-app")
4. Enable Google Analytics (optional)
5. Create project

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" sign-in provider
5. Set your project's public-facing name
6. Add your domain to authorized domains (your Replit domain)

## 3. Create Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Start in "test mode" (you can secure it later)
4. Choose a location close to your users
5. Click "Done"

## 4. Get Firebase Config

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web app" icon (</>)
4. Register your app with a nickname
5. Copy the Firebase configuration object

## 5. Update Configuration

Replace the configuration in `services/firebaseService.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 6. Security Rules (Production)

For production, update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /userData/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /analyses/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /paperTrades/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 7. Environment Variables (Optional)

For added security, you can use environment variables in Replit:

1. Go to your Repl's Secrets tab
2. Add your Firebase config values as secrets
3. Update the service to use `process.env.FIREBASE_API_KEY`, etc.

## Features Enabled

- ✅ Google OAuth Authentication
- ✅ Save user preferences to cloud
- ✅ Store up to 50 analysis results (free tier)
- ✅ Sync data across devices
- ✅ Analysis history viewing
- ✅ Paper trading system foundation
- ✅ User profile management
