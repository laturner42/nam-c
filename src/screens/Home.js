import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
} from 'react-native';

import RoomSelector from '../components/RoomSelector';


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
