# Findaroo - Lost & Found Network

A React Native mobile app built with Expo that helps people reunite lost items with their owners through a crowdsourced network.

## 🏗️ Project Structure

```
findaroo/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx      # Styled button component
│   │   ├── Input.tsx       # Form input with validation
│   │   ├── ItemCard.tsx    # Item display card for feed
│   │   └── Loading.tsx     # Loading spinner component
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication management
│   │   ├── useChat.ts      # Chat functionality
│   │   └── useItems.ts     # Items CRUD operations
│   ├── navigation/         # App navigation setup
│   │   └── AppNavigator.tsx # Main navigation configuration
│   ├── screens/            # App screens
│   │   ├── ChatScreen.tsx      # Real-time messaging
│   │   ├── CreateItemScreen.tsx # Post lost/found items
│   │   ├── HomeFeedScreen.tsx  # Main item feed with filters
│   │   ├── ItemDetailsScreen.tsx # Detailed item view
│   │   ├── LoginScreen.tsx     # User authentication
│   │   ├── ProfileScreen.tsx   # User profile management
│   │   └── SignupScreen.tsx    # User registration
│   ├── services/           # External service integrations
│   │   └── supabaseClient.ts # Supabase configuration
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # All app types and interfaces
│   └── utils/              # Utility functions
│       ├── location.ts     # GPS and geocoding utilities
│       └── uploadImage.ts  # Image upload to Supabase Storage
├── App.tsx                 # Main app component
├── app.config.js          # Expo configuration
├── babel.config.js        # Babel configuration for NativeWind
├── global.css             # NativeWind CSS imports
├── metro.config.js        # Metro bundler configuration
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
└── .env                   # Environment variables
```

## 🚀 Features

### ✅ Authentication
- **Secure signup/login** with Supabase Auth
- **Persistent sessions** across app restarts
- **Profile management** with avatar upload
- **Karma system** for user reputation

### ✅ Item Management
- **Post lost/found items** with photos and location
- **Category filtering** (electronics, clothing, pets, etc.)
- **Status filtering** (lost vs found items)
- **Search functionality** by title/description
- **Location-based tracking** with GPS coordinates
- **Image upload** to Supabase Storage
- **Mark items as resolved**

### ✅ Communication
- **Real-time chat** between finders and owners
- **1-on-1 messaging** per item
- **Message history** with timestamps
- **Live message updates** via Supabase subscriptions

### ✅ UI/UX
- **Modern design** with Tailwind CSS styling
- **Responsive layouts** for different screen sizes
- **Loading states** and error handling
- **Optimistic UI updates** for better UX
- **Pull-to-refresh** functionality
- **Tab navigation** for easy app browsing

## 🛠️ Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Supabase
  - Authentication
  - PostgreSQL Database
  - Real-time subscriptions
  - File storage
- **Navigation**: React Navigation v6
- **State Management**: React Hooks
- **Image Handling**: Expo ImagePicker
- **Location Services**: Expo Location
- **Form Handling**: Custom hooks with validation

## 📱 Key Screens

### Home Feed
- **Infinite scroll** of lost/found items
- **Filter by status** (lost/found) and category
- **Search bar** for finding specific items
- **Item cards** with images, descriptions, and user info
- **Floating action button** to create new posts

### Create Item
- **Image upload** from device gallery
- **Form validation** for required fields
- **Category selection** with emoji icons
- **GPS location** capture and address display
- **Rich text description** input

### Item Details
- **Full item information** display
- **High-resolution image** viewing
- **Contact poster** button
- **Mark as resolved** (for item owners)
- **User karma** and profile information

### Chat
- **Real-time messaging** between users
- **Message bubbles** with timestamps
- **Auto-scroll** to latest messages
- **Date separators** for conversation clarity
- **Typing indicators** and send status

### Profile
- **Avatar upload** and display
- **Editable user information**
- **Karma points** tracking
- **Account management** and sign out

## 🔧 Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account and project

### 1. Clone and Install
```bash
git clone <repository-url>
cd findaroo
npm install
```

### 2. Environment Configuration
Create `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Supabase Setup

#### Database Tables
```sql
-- Users table
CREATE TABLE users (
    id UUID REFERENCES auth.users PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    karma INTEGER DEFAULT 0,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items table
CREATE TABLE items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('lost', 'found')),
    location JSONB NOT NULL,
    image_url TEXT,
    user_id UUID REFERENCES users(id) NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    reward_amount DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    sender_id UUID REFERENCES users(id) NOT NULL,
    recipient_id UUID REFERENCES users(id) NOT NULL,
    item_id UUID REFERENCES items(id) NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Karma events table
CREATE TABLE karma_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    points INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Storage Buckets
- `item-images` - For item photos
- `profile-pics` - For user avatars

#### Row Level Security (RLS)
Enable RLS on all tables and create appropriate policies for user access control.

### 4. Run the App
```bash
# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

## 🔐 Security Features

- **Row Level Security** enabled on all Supabase tables
- **Authenticated uploads** to storage buckets
- **Input validation** on all forms
- **Secure image URLs** with proper access controls
- **User session management** with automatic refresh

## 🚀 Future Enhancements

- **Push notifications** for new messages
- **Map view** integration with Mapbox
- **Advanced search** with location radius
- **Tip system** with Stripe integration
- **Social features** (user ratings, comments)
- **Image recognition** for automatic categorization
- **Offline support** with local data caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
