
// React Native App (Expo) — BlueWave User MVP
// 📱 Includes Login, Book Vehicle, View Bookings
// 🔧 Firebase Auth + Firestore + Navigation (fixed Rollup import issue)

import React, { useEffect, useState, createContext, useContext } from 'react';
import { Text, View, TextInput, Button, FlatList, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MSG_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const AuthContext = createContext();

function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return <AuthContext.Provider value={{ user }}>{loading ? <ActivityIndicator /> : children}</AuthContext.Provider>;
}

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace('Home');
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, padding: 8, marginBottom: 10 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, padding: 8, marginBottom: 10 }} />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

function HomeScreen({ navigation }) {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, marginBottom: 20 }}>Welcome to BlueWave</Text>
      <Button title="Book a Vehicle" onPress={() => navigation.navigate('Book')} />
      <Button title="My Bookings" onPress={() => navigation.navigate('MyBookings')} />
    </View>
  );
}

function BookScreen() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vehicles'), snap => {
      setVehicles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const handleBook = async (vehicleId) => {
    await addDoc(collection(db, 'bookings'), {
      uid: user.uid,
      vehicleId,
      status: 'pending',
    });
    alert('Booking request sent!');
  };

  return (
    <FlatList
      data={vehicles}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={{ padding: 10, borderBottomWidth: 1 }}>
          <Text>{item.name} ({item.type})</Text>
          <Button title="Book" onPress={() => handleBook(item.id)} />
        </View>
      )}
    />
  );
}

function MyBookingsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'bookings'), where('uid', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  return (
    <FlatList
      data={bookings}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={{ padding: 10, borderBottomWidth: 1 }}>
          <Text>Vehicle ID: {item.vehicleId}</Text>
          <Text>Status: {item.status}</Text>
        </View>
      )}
    />
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Book" component={BookScreen} />
            <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
