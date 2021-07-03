import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { getRandomColor } from './utils';

export default function RoomSelector({ room, navigate }) {
  const [members, setMembers] = useState({});
  const [recentMessage, setRecentMessage] = useState({ content: 'Loading' });
  const [color, setColor] = useState('white')

  useEffect(() => {
    setColor(getRandomColor(room.roomId, 50, 150));
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
        borderBottomColor: color,
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
          backgroundColor: color,
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
