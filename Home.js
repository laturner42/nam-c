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

import RoomSelector from './RoomSelector';


export default function Home(props) {
  const {
    client,
    navigation,
  } = props;

  return (
    <SafeAreaView style={{ flexGrow: 1, backgroundColor: '#eee' }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          flexGrow: 1,
          paddingBottom: 10,
        }}
      >
        <StatusBar barStyle="dark-content" />
        {
          client ?
            client.getRooms().map((room) => (
              <RoomSelector
                key={room.roomId}
                room={room}
                navigate={navigation.navigate}
              />
            ))
            : <Text>loading</Text>
        }
      </ScrollView>
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
