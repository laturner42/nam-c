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


export default function RoomSelector({ room, navigate }) {
  const [members, setMembers] = useState({});
  const [recentMessage, setRecentMessage] = useState({ content: 'Loading' });

  useEffect(() => {
    setMembers(room.getMembers().reduce((out, curr) => {
      out[curr.userId] = curr;
      return out;
    }), {});
    setRecentMessage(room.timeline[room.timeline.length-1].event);
  }, [room]);

  return (
    <TouchableOpacity
      key={room.roomId}
      onPress={() => navigate('Room', { roomId: room.roomId })}
      style={{
        width: '100%',
        height: 90,
        borderBottomColor: '#3f9',
        borderBottomWidth: 1,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          margin: 10,
          backgroundColor: '#2eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: 'white',
            fontSize: 33,
          }}
        >
          {room.name[0].toUpperCase()}
        </Text>
      </View>
      <View>
        <Text style={{ color: '#000', fontSize: 17, fontWeight: 'bold' }}>{room.name}</Text>
        {room.timeline.length > 0 && <Text style={{ color: '#333', fontSize: 16 }}>{(members[recentMessage.sender] || {}).rawDisplayName}</Text> }
        {room.timeline.length > 0 && <Text style={{ color: '#888', fontSize: 14 }}>{recentMessage.content.body}</Text> }
      </View>
    </TouchableOpacity>
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
