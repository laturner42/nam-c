import allSettled from 'promise.allsettled';
allSettled.shim();
import { registerRootComponent } from 'expo';
import React, { useState } from 'react';
import {
  StyleSheet,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Login from './screens/Login';
import Home from './screens/Home';
import Room from './screens/Room';

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

registerRootComponent(App);