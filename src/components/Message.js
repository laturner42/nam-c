import React, { useEffect, useState, useRef } from 'react';
import {
  Dimensions,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import moment from 'moment';
import { FontAwesome } from '@expo/vector-icons';
import { connectActionSheet } from '@expo/react-native-action-sheet'
import { getRandomColor, getContent } from './utils';

const imageUrl = (m) => `https://synapse.room409.xyz/_matrix/media/r0/download/${m.content.url.replace('mxc://', '')}`;

function Message(props) {
  const {
    fromMe,
    isRecent,
    message: m,
    members,
    reactions,
    setReplyTo,
    lookupRepliedMessage,
  } = props;

  const messageScoller = useRef();
  const [mediaDims, setMediaDims] = useState(null);
  const [nameColor, setNameColor] = useState('rgb(255,255,255)');
  const [repliedMessage, setRepliedMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNameColor(getRandomColor(m.sender, 200));
    if (m.content.msgtype === 'm.image') {
      Image.getSize(imageUrl(m), (width, height) => setMediaDims({ width, height }));
    } else {
      setLoading(false);
    }
    if (m.content['m.relates_to'] && m.content['m.relates_to']['m.in_reply_to']) {
      (async () => {
        const oldMessage = await lookupRepliedMessage(m.content['m.relates_to']['m.in_reply_to'].event_id);
        setRepliedMessage(oldMessage);
      })(); 
    }
  }, [m]);

  const maxWidth = Math.floor(Dimensions.get('window').width * .7);

  let media = null;
  if (m.content.msgtype === 'm.image') {
    let imgWidth;
    let imgHeight;
    if (!mediaDims) {
      imgWidth = 0;
      imgHeight = 0;
    } else if (mediaDims.width > mediaDims.height) {
      imgWidth = !mediaDims ? 0 : Math.min(maxWidth * 0.9, mediaDims.width);
      imgHeight = !mediaDims ? 0 : mediaDims.height * (imgWidth / mediaDims.width)
    } else {
      imgHeight = !mediaDims ? 0 : Math.min(maxWidth * 0.9, mediaDims.height);
      imgWidth = !mediaDims ? 0 : mediaDims.width * (imgHeight / mediaDims.height);
    }

    media = (
      <Image
        style={{
          width: imgWidth,
          height: imgHeight,
          borderRadius: 10,
          marginBottom: 18,
        }}
        onLoad={() => {
          setLoading(false)
        }}
        source={{
          uri: imageUrl(m),
        }}
      />
    )
  }

  const [textDims, setTextDims] = useState({ width: 50, height: 20 });
  const [timeDims, setTimeDims] = useState({ width: 50 });

  const textWidth = Math.floor(textDims.width) + Math.floor(timeDims.width) + 30;
  const hitMaxWidth = Math.floor(textDims.width) > (maxWidth - Math.floor(timeDims.width));

  const hiddenWidth = 60;

  let myReactions = null;
  if (reactions[m.event_id]) {
    myReactions = reactions[m.event_id]
      .reduce((out, event) => {
        const emoji = event.content['m.relates_to'].key;
        if (!out[emoji]) out[emoji] = 1;
        else out[emoji] = out[emoji] + 1;
        return out;
      }, {});
  }

  return (
    <ScrollView
      ref={messageScoller}
      key={m.event_id}
      style={{
        width: '100%',
        // borderColor: 'red',
        // borderWidth: 1,
      }}
      scrollEventThrottle={2}
      onScroll={({ nativeEvent }) => {
        if (nativeEvent.contentOffset.x >= hiddenWidth * 0.75) {
          // setReplyTo(m);
        }
      }}
      onScrollEndDrag={({ nativeEvent }) => {
        if (nativeEvent.contentOffset.x >= hiddenWidth * 0.75) {
          setReplyTo(m);
        }
        messageScoller.current.scrollTo({ x: 0, animated: true });
      }}
      contentContainerStyle={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: fromMe ? 'flex-end' : 'space-between',
        marginRight: -hiddenWidth,
      }}
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces={false}
    >
      <TouchableOpacity
        style={{
          backgroundColor: fromMe ? '#4ae' : '#668',
          maxWidth: 300,
          borderRadius: 18,
          minHeight: 30,
          padding: 10,
          paddingBottom: hitMaxWidth ? 25 : 10,
          minWidth: hitMaxWidth ? maxWidth : textWidth,
          margin: 5,
          marginTop: isRecent ? 2 : 8,
          marginBottom: myReactions ? 10 : 0,
          display: 'flex',
          flexDirection: 'column',
        }}
        activeOpacity={1}
        onLongPress={() => {
          if (!fromMe) return null;
          props.showActionSheetWithOptions(
            {
              options: ['Edit', 'Delete', 'Cancel'],
              cancelButtonIndex: 2,
              destructiveButtonIndex: 1,
            },
            (buttonIndex) => {
              console.log('You pressed', buttonIndex);
            },
          )
        }}
      >
        {
          !!repliedMessage && (
            <TouchableOpacity
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 5,
              }}
              activeOpacity={0.8}
              onPress={() => {
                alert('Eventually this will scroll to the replied message');
              }}
            >
              <View
                style={{
                  borderRadius: 5,
                  borderWidth: 2,
                  borderColor: fromMe ? 'white' : '#ddd',
                  height: '100%',
                  marginRight: 5,
                }}
              />
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: fromMe ? 'white' : getRandomColor(repliedMessage.sender, 210),
                    fontSize: 13,
                    fontWeight: 'bold',
                  }}
                >
                  {(members[repliedMessage.sender] || {}).rawDisplayName || repliedMessage.sender}
                </Text>
                <Text
                  style={{
                    color: 'white',
                    fontSize: 15,
                  }}
                >
                  {getContent(repliedMessage)}
                </Text>
              </View>
            </TouchableOpacity>
          )
        }
        {
          !fromMe &&
          <Text style={{ color: nameColor, fontWeight: 'bold', fontSize: 14 }}>{(members[m.sender] || {}).rawDisplayName || m.sender}</Text>
        }
          {
            media
              ? media
              : (
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                  }}
                >
                  <Text
                    style={styles.contentText}
                    onLayout={(e) => setTextDims(e.nativeEvent.layout)}
                  >
                    {getContent(m)}
                  </Text>
                </View>
              )
          }
          <Text
            onLayout={(e) => setTimeDims(e.nativeEvent.layout)}
            style={{
              // borderWidth: 1,
              color: fromMe ? '#eee' : '#ddd',
              fontSize: 10,
              textAlign: 'right',
              position: 'absolute',
              right: 10,
              bottom: 10,
            }}
          >
            {moment(m.origin_server_ts).format('hh:mm A')}
          </Text>
        {
          !!myReactions && (
            <View
              style={{
                position: 'absolute',
                left: 10,
                bottom: -10,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              {
                Object.keys(myReactions)
                  .map((key) => (
                    <View
                      key={key}
                      style={{
                        backgroundColor: '#dde',
                        height: 20,
                        borderRadius: 10,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingRight: 6,
                        marginRight: 2,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: '#666' }} >{key}</Text>
                      <Text style={{ fontSize: 13, color: '#666' }} >{myReactions[key]}</Text>
                    </View>
                  ))
              }
            </View>
          )
        }
      </TouchableOpacity>
      <View
        style={{
          width: hiddenWidth,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FontAwesome
          name="reply"
          size={22}
          color="#666"
        />
      </View>
    </ScrollView>
  );
}

const styles = {
  contentText: {
    color: 'white',
    fontSize: 18,
    // borderWidth: 1,
    borderColor: 'red',
  }
};

export default connectActionSheet(Message);
