import allSettled from 'promise.allsettled';
allSettled.shim();
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useReducer, useRef } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import mtx from 'matrix-js-sdk';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';

import Login from './Login';
import Home from './Home';
import Room from './Room';

const Stack = createStackNavigator();

export default function App() {
  const [client, setClient] = useState(null);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login">
          {props => <Login {...props} client={client} setClient={setClient} />}
        </Stack.Screen>
        <Stack.Screen name="Chats" options={{
        animationEnabled: false,
      }}>
          {props => <Home {...props} client={client} />}
        </Stack.Screen>
        <Stack.Screen name="Room">
          {props => <Room {...props} client={client} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flexDirection: 'column',
    // alignItems: 'flex-start',
    // justifyContent: 'flex-end',
  },
});
