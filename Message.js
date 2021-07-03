import allSettled from 'promise.allsettled';
allSettled.shim();
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useReducer, useRef } from 'react';
import {
  Dimensions,
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
  Image,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import mtx from 'matrix-js-sdk';
import moment from 'moment';
import axios from 'axios';
import { HeaderHeightContext } from '@react-navigation/stack';
import { Buffer } from 'buffer';

const imageUrl = (m) => `https://synapse.room409.xyz/_matrix/media/r0/download/${m.content.url.replace('mxc://', '')}`;

export default function Message(props) {
  const {
    fromMe,
    isRecent,
    message: m,
    members,
  } = props;

  const [mediaDims, setMediaDims] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (m.content.msgtype === 'm.image') {
      Image.getSize(imageUrl(m), (width, height) => setMediaDims({ width, height }));
    } else {
      setLoading(false);
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
          marginBottom: 5,
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

  return (
    <View
      key={m.event_id}
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: fromMe ? 'flex-end' : 'flex-start',
        width: '100%',
      }}
    >
      <View
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
          marginBottom: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {
          !fromMe &&
          <Text style={{ color: '#3f7', fontWeight: 'bold', fontSize: 14 }}>{members[m.sender].rawDisplayName}</Text>
        }
          {
            media
          }
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
              {m.content.body}
            </Text>
          </View>
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
        {/* </View> */}
      </View>
    </View>
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
