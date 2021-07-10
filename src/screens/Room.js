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
import moment from 'moment';
import { HeaderHeightContext } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { Buffer } from 'buffer';
import Message from '../components/Message';
import { getRandomColor, getContent } from '../components/utils';

const handledEvents = ['m.reaction', 'm.room.message'];

const roomMessagesReducer = (state, event) => {
  if (event.unsigned && event.unsigned.redacted_by) return state;
  const { messages, reactions } = state;
  const messagesSet = new Set(messages);
  // console.log(event, type);
  if (event.type === 'm.reaction') {
    const { event_id } = event.content['m.relates_to'];
    if (!reactions[event_id]) {
      reactions[event_id] = [];
    }
    reactions[event_id].push(event);
  } else if (event.type === 'm.room.message') {
    messagesSet.add(event);
  }
  return {
    ...state,
    messages: [...messagesSet].sort((a, b) => a.origin_server_ts - b.origin_server_ts),
    reactions,
  }
};

export default function Room({ route, navigation, client }) {
  const {
    roomId,
  } = route.params;
  const activeRoom = client.getRoom(roomId);
  const mainScroller = useRef();
  const textBox = useRef();
  const [message, setMessage] = useState('');
  const [members, setMembers] = useState({});
  const [percentUploaded, setPercentUploaded] = useState(1);
  const [replyTo, setReplyTo] = useState(null);

  const setReplyToMessage = (message) => {
    setReplyTo(message);
    textBox.current.focus();
  }

  const [state, dispatch] = useReducer(roomMessagesReducer, { messages: [], reactions: {} });

  const [distanceToEnd, setDistancetoEnd] = useState(0);

  const lookupRepliedMessage = async (event_id) => await client.fetchRoomEvent(activeRoom.roomId, event_id);

  const sendMessage = async () => {
    const content = {
      body: message,
      msgtype: 'm.text',
    };
    if (replyTo) {
      content['m.relates_to'] = {
        'm.in_reply_to': {
          event_id: replyTo.event_id,
        },
      }
    }
    await client.sendEvent(activeRoom.roomId, "m.room.message", content, "");
    setMessage('');
    setReplyTo(null);
  }

  const uploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
    }

    setPercentUploaded(0);

    const { base64, cancelled, uri, width, height } = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      exif: true,
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

    const context = {
      w: width,
      h: height,
      mimetype: `image/${type}`,
      size: Buffer.byteLength(data),
    }

    const progressHandler = ({ loaded, total }) => setPercentUploaded(loaded/total);

    const content_uri = await client.uploadContent(data, { rawResponse: false, type, onlyContentUri: true, progressHandler });
    await client.sendImageMessage(activeRoom.roomId, content_uri, context, uri.substr(uri.lastIndexOf('/') + 1));
  }

  useEffect(() => {
    let canceled = false;
    client.on("Room.timeline", ({ event }, room, toStartOfTimeline) => {
      if (canceled) return;
      if (!handledEvents.includes(event.type)) {
        return; // only use messages
      }
      if (room.roomId === roomId) {
        dispatch(event);
      } else {
        alert('you got a message in another room ' + room.name + ' ' + event.content.body);
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
      .filter(t => handledEvents.includes(t.event.type))
      .map(t => {
        dispatch(t.event);
      });
  }, [activeRoom]);

  const { messages, reactions } = state;

  const isRecent = (i) => {
    if (!i) return false;
    return (
      messages[i].origin_server_ts - messages[i-1].origin_server_ts < 350000
      && messages[i].sender === messages[i-1].sender
      && moment(messages[i].origin_server_ts).dayOfYear() === moment(messages[i-1].origin_server_ts).dayOfYear()
    );
  }

  const renderList = [];

  messages.map((m, i) => {
    if (i === 0 || moment(messages[i-1].origin_server_ts).dayOfYear() !== moment(m.origin_server_ts).dayOfYear()) {
      const ts = moment(m.origin_server_ts);
      renderList.push(
        <View
          key={`time-divider-${m.origin_server_ts}`}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
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
            <Text style={{ color: 'white' }} >{ts.dayOfYear() === moment().dayOfYear() ? 'Today' : ts.format('MMMM Do YYYY')}</Text>
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
        reactions={reactions}
        isRecent={isRecent(i)}
        client={client}
        setReplyTo={setReplyToMessage}
        lookupRepliedMessage={lookupRepliedMessage}
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
                justifyContent: 'flex-end',
              }}
              keyboardVerticalOffset={headerHeight}
            >
              <ScrollView
                ref={mainScroller}
                onContentSizeChange={() => {
                  if (distanceToEnd < 100) {
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
                showsVerticalScrollIndicator={false}
                invertStickyHeaders
                keyboardDismissMode="on-drag"
                style={{
                  backgroundColor: '#f8f8f8',
                  flexDirection: 'column',
                  borderWidth: 1,
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
                !!replyTo && (
                  <View
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      // backgroundColor: '#666',
                      borderTopColor: '#bbb',
                      borderTopWidth: 1,
                      borderBottomColor: '#bbb',
                      borderBottomWidth: 1,
                      padding: 3,
                    }}
                  >
                    <View
                      style={{
                        marginLeft: 45,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        maxWidth: '80%',
                        height: '100%',
                      }}
                    >
                      <View
                        style={{
                          borderRadius: 2,
                          borderWidth: 2,
                          borderColor: '#666',
                          height: '90%',
                          marginRight: 4,
                        }}
                      />
                      <View
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            color: getRandomColor(replyTo.sender, 0, 120),
                          }}
                        >
                          {(members[replyTo.sender] || {}).rawDisplayName || replyTo.sender}
                        </Text>
                        <Text
                          style={{
                            fontSize: 16,
                          }}
                        >
                          {getContent(replyTo, true)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setReplyTo(null)}
                      style={{
                        // marginRight: 10,
                        padding: 10,
                      }}
                    >
                      <AntDesign name="closecircleo" size={22} color="#666" />
                    </TouchableOpacity>
                  </View>
                )
              }
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
                        color={Colors.blue800}
                        style={{
                          height: 5,
                          borderRadius: 5,
                        }}
                      />
                    </View>
                  </View>
                )
              }
              {/* <View></View> */}
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
                  ref={textBox}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  onFocus={() => {
                    if (distanceToEnd < 100) {
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
                    fontSize: 16,
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
