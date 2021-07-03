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
import { ProgressBar, Colors } from 'react-native-paper';
import { AntDesign, Entypo } from '@expo/vector-icons';
import mtx from 'matrix-js-sdk';
import moment from 'moment';
import { HeaderHeightContext } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { Buffer } from 'buffer';
import Message from './Message';
import { getAge } from './utils';

const roomMessagesReducer = (state, message) => {
  const { messages } = state;
  const messagesSet = new Set(messages);
  messagesSet.add(message);
  return {
    ...state,
    messages: [...messagesSet].sort((a, b) => a.origin_server_ts - b.origin_server_ts),
  }
};

export default function Room({ route, navigation, client }) {
  const {
    roomId,
  } = route.params;
  const activeRoom = client.getRoom(roomId);
  const mainScroller = useRef();
  const [message, setMessage] = useState('');
  const [members, setMembers] = useState({});
  const [percentUploaded, setPercentUploaded] = useState(1);

  const [state, dispatch] = useReducer(roomMessagesReducer, { messages: [] });

  const [distanceToEnd, setDistancetoEnd] = useState(0);

  const sendMessage = async () => {
    const content = {
      body: message,
      msgtype: 'm.text',
    }
    await client.sendEvent(activeRoom.roomId, "m.room.message", content, "");
    setMessage('');
  }

  const uploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
    }

    setPercentUploaded(0);

    const { base64, cancelled, uri } = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (cancelled) {
      setPercentUploaded(100);
      return;
    }

    const data = Buffer.from(base64, "base64");
    const type = uri.substr(uri.lastIndexOf('.') + 1);

    const progressHandler = ({ loaded, total }) => setPercentUploaded(loaded/total);

    const content_uri = await client.uploadContent(data, { rawResponse: false, type, onlyContentUri: true, progressHandler });
    await client.sendImageMessage(activeRoom.roomId, content_uri, {}, '');
  }

  useEffect(() => {
    let canceled = false;
    client.on("Room.timeline", (event, room, toStartOfTimeline) => {
      if (canceled) return;
      if (event.getType() !== "m.room.message") {
        return; // only use messages
      }
      if (room.roomId === roomId) {
        dispatch(event.event);
      } else {
        alert('you got a message in another room ' + room.name + ' ' + event.event.content.body);
      }
    });
    return () => { canceled = true; };
  }, [client]);

  useEffect(() => {
    setMembers(activeRoom.getMembers().reduce((out, curr) => {
      out[curr.userId] = curr;
      return out;
    }), {});
    navigation.setOptions({ title: activeRoom.name });
    activeRoom.timeline
      .filter(t => t.event.type === 'm.room.message')
      .map(t => {
        dispatch(t.event);
      });
  }, [activeRoom]);

  const { messages } = state;

  const isRecent = (i) => {
    if (!i) return false;
    return messages[i].origin_server_ts - messages[i-1].origin_server_ts < 350000
      && messages[i].sender === messages[i-1].sender;
  }

  const renderList = [];

  messages.map((m, i) => {
    if (i === 0 || moment(messages[i-1].origin_server_ts).dayOfYear() !== moment(m.origin_server_ts).dayOfYear()) {
      renderList.push(
        <View
          key={`time-divider-${m.origin_server_ts}`}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              height: 25,
              borderRadius: 25,
              backgroundColor: '#988',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: 10,
              paddingRight: 10,
            }}
          >
            <Text style={{ color: 'white' }} >{moment(m.origin_server_ts).format('MMMM Do YYYY')}</Text>
          </View>
        </View>
      )
    }
    renderList.push(
      <Message
        key={m.event_id}
        message={m}
        fromMe={m.sender === client.getUserId()}
        members={members}
        isRecent={isRecent(i)}
        client={client}
      />
    )
  });

  return (
    <HeaderHeightContext.Consumer>
      {
        headerHeight => (
          <SafeAreaView  style={{ flexGrow: 1, backgroundColor: '#eee' }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{
                flex: 1,
              }}
              keyboardVerticalOffset={headerHeight}
            >
              <ScrollView
                ref={mainScroller}
                onContentSizeChange={() => {
                  if (distanceToEnd < 50) {
                    mainScroller.current.scrollToEnd({ animated: true });
                  }
                }}
                onMomentumScrollEnd={({ nativeEvent }) => {
                  const newDistToEnd = nativeEvent.contentSize.height -
                    (nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y);
                  setDistancetoEnd(
                    newDistToEnd
                  );
                }}
                invertStickyHeaders
                keyboardDismissMode="on-drag"
                style={{
                  backgroundColor: '#f8f8f8',
                  flexDirection: 'column',
                }}
                contentContainerStyle={{
                  justifyContent: 'flex-end',
                  alignItems: 'flex-start',
                  flexGrow: 1,
                  paddingBottom: 10,
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={false}
                    onRefresh={() => console.log('Refreshing')}
                    title="Loading more messages"
                  />
                }
              >
                <StatusBar barStyle="dark-content" />
                { renderList }
              </ScrollView>
              {
                percentUploaded < 1 && (
                  <View
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopColor: '#bbb',
                      borderTopWidth: 1,
                      borderBottomColor: '#bbb',
                      borderBottomWidth: 1,
                      padding: 3,
                    }}
                  >
                    <Text style={{ color: '#666', fontSize: 12 }}>uploading...</Text>
                    <View
                      style={{
                        width: '90%',
                        margin: 3,
                      }}
                    >
                      <ProgressBar
                        indeterminate={!percentUploaded}
                        progress={percentUploaded}
                        style={{
                          height: 5,
                          borderRadius: 5,
                        }}
                      />
                    </View>
                  </View>
                )
              }
              <View></View>
              <View
                style={{
                  width: '100%',
                  backgroundColor: '#eee',
                  padding: 5,
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <TouchableOpacity
                  onPress={uploadImage}
                  // disabled={!message}
                  style={{
                    height: 30,
                    width: 30,
                    marginLeft: 2,
                    marginRight: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Entypo name="attachment" size={26} color="#459" />
                </TouchableOpacity>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  onFocus={() => {
                    if (distanceToEnd < 50) {
                      mainScroller.current.scrollToEnd({ animated: true });
                    }
                  }}
                  style={{
                    width: '80%',
                    minHeight: 30,
                    padding: 5,
                    paddingLeft: 10,
                    paddingRight: 10,
                    backgroundColor: '#fbfbfb',
                    borderColor: '#bbb',
                    borderWidth: 1,
                    borderRadius: 15,
                  }}
                />
                <TouchableOpacity
                  onPress={sendMessage}
                  disabled={!message}
                  style={{
                    height: 30,
                    width: 30,
                    marginRight: 5,
                    borderRadius: 15,
                    backgroundColor: message ? '#09f' : '#888',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AntDesign name="arrowup" size={26} color="white" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        )
      }
    </HeaderHeightContext.Consumer>
  );
}

const styles = StyleSheet.create({
  container: {
    
    // alignItems: 'flex-start',
    // justifyContent: 'flex-end',
  },
});
