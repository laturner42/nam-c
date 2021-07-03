import allSettled from 'promise.allsettled';
allSettled.shim();
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useReducer, useRef } from 'react';
import {
  Button,
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
import RoomSelector from './RoomSelector';


export default function Login(props) {
  const {
    navigation,
    client,
    setClient,
  } = props;

  const [userUsername, setUserUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkFinished, setCheckFinished] = useState(false);

  const goToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{name: 'Chats'}],
    });
  }

  const login = (user, password, saved) => {
    if (client) return;
    if (!user || !password) {
      setLoading(false);
      setCheckFinished(true);
      return;
    }
    setLoading(true);
    const opts = { user, password };
    const newClient = mtx.createClient('https://synapse.room409.xyz');
    newClient.login('m.login.password', opts)
      .then(async () => {
        newClient.once('sync', async (state) => {
          if (state === 'PREPARED') {
            console.log('Sync complete');
            setClient(newClient);
            if (!saved) goToHome();
          }
        });
        newClient.startClient();
        await SecureStore.setItemAsync('username', user);
        await SecureStore.setItemAsync('password', password);
      })
      .catch(console.error);
    if (saved) goToHome();
  };

  useEffect(() => {
    Promise.all([SecureStore.getItemAsync('username'), SecureStore.getItemAsync('password')])
      .then(([username, password]) => login(username, password, true))
      .catch(console.error);
  }, []);

  if (!checkFinished) return null;

  return (
    <SafeAreaView
      style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#eee',
        marginTop: 100,
      }}
    >
      <TextInput
        style={{
          height: 40,
          width: 200,
          borderWidth: 1,
        }}
        autoCapitalize="none"
        placeholder="username"
        value={userUsername}
        onChangeText={setUserUsername}
      />
      <TextInput
        style={{
          height: 40,
          width: 200,
          borderWidth: 1,
        }}
        password
        placeholder="password"
        value={userPassword}
        onChangeText={setUserPassword}
      />
      <Button
        title="Login"
        onPress={() => login(userUsername, userPassword)}
        disabled={loading}
      />
    </SafeAreaView>
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
