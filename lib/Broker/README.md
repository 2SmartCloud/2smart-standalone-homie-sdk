# Broker

Transport instance for MQTT broker.

***

**MQTTTransport(options)**

Class wraps a client connection to an MQTT broker over an arbitrary transport method (TCP, TLS, WebSocket, ecc).

- options:
    - uri: **Required.** mqtt broker URI;
    - retain: specify global `retain` flag for all publish messages (can be overwritten)
    - username: the username required by your broker, if any
    - password: the password required by your broker, if any
    - rootTopic: prefix for all topics to subscribe or publish
    - session: custom sessionID. If not specified, random sessionID will be generated.
    - tls: object which is used to take control over `_rejectUnauthorized` option. If both options `enable` and `selfSigned` are `true`, then transport could be used for WSS or MQTTS connection without certificate verification.
        - `enable`: `Boolean`.
        - `selfSigned`: `Boolean`.
    - will: a message that will sent by the broker automatically when the client disconnect badly. The format is:
        - `topic`: the topic to publish
        - `payload`: the message to publish
        - `qos`: the QoS
        - `retain`: the retain flag
    - customCallbacks: a set of custom fuctions, to handle mqtt broker events. This is an alternative for event subscription to an instance
        - `onConnect`: callback, when transport successfully connected to MQTT broker.
        - `onReconnect`: callback, when transport starts reconnect process to MQTT broker.
        - `onClose`: callback, when connection with MQTT broker is closed.
        - `onDisconnect`: callback, when transport is disconnected from MQTT broker.
        - `onOffline`: callback, when connection with MQTT broker is lost.
        - `onConnectError`: callback, when transport couldn't connect to MQTT broker.
        - `onEnd`: callback, when transport calls `.end()` function.
        - `onMessage`: callback, when transport receives a message from MQTT broker.
        - `onPacketSend`: callback, when transport sends a mqtt packet to MQTT broker.
        - `onPacketReceive`: callback, when transport receives a mqtt packet from MQTT broker.
        - `onError`: callback, when transport cannot connect (i.e. connack rc != 0) or when a parsing error occurs.
        - `onSubscribe`: callback, when transport subscribes to a topic.
        - `onUnsubscribe`: callback, when transport unsubscribed from a topic.
    - keepalive: set custom keepalive value. `60` by default.
    - debug: custom logger, if needed. [Original logger](./../utils/README.md) instance can be used as a reference.
***

**MQTTTransport.connect()**

Connect to broker by given URI.

Returns `Promise`, which could only be resolved on connect or close event.
   
***

**MQTTTransport.publish(topic, message, options, [callback])**

Publish a message to a topic.
If `rootTopic` is specified during instance creation, this method automatically append it to a given `topic`.
Example:
```
rootTopic: 'custom-root-topic'
topic: 'device/node/123'

Published topic: custom-root-topic/device/node/123
```

- topic: is the topic to publish to, String
- message: is the message to publish, Buffer or String
- options: is the options to publish with, including:
    `qos` QoS level, Number, default `0`
    `retain` retain flag, `Boolean`, default `false`
    `dup` mark as duplicate flag, `Boolean`, default `false`
- callback: `function (err)`, fired when the QoS handling completes, or at the next tick if QoS 0. An error occurs if client is disconnecting.

***

**MQTTTransport.message([callback])**

- callback: `function (topic, message, packet)` handle message from broker
    - topic: `String`
    - message: `Buffer`
    - packet: `Object`

***

**MQTTTransport.subscribe(topic/topics array, [callback]**

Subscribe to a topic or topics.
If `rootTopic` is specified during instance creation, this method automatically append it to a given `topic`.
Example:
```
rootTopic: 'custom-root-topic'
topic: 'device/node/123'

Subscribed topic: custom-root-topic/device/node/123
```

- topic: topic or topics to subscribe `String`/`Array`
- callback: `function (err, granted)` callback fired on suback where:
    `err` a subscription error or an error that occurs when client is disconnecting
    `granted` is an array of {topic, qos} where:
        `topic` is a subscribed to topic
        `qos` is the granted QoS level on it


***

**MQTTTransport.unsubscribe(topic/topics array, [callback])**

Unsubscribe from a topic or topics.
If `rootTopic` is specified during instance creation, this method automatically append it to a given `topic`.
Example:
```
rootTopic: 'custom-root-topic'
topic: 'device/node/123'

Unsubscribed topic: custom-root-topic/device/node/123
```

- topic: topic or an array of topics to unsubscribe from `String`/`Array`
- callback: `function (err)` fired on unsuback. An error occurs if client is disconnecting.

***

**MQTTTransport.end([force], [cb])**

Close the client, accepts the following options:

- force: passing it to true will close the client right away, without waiting for the in-flight messages to be acked. This parameter is optional.
- cb: will be called when the client is closed. This parameter is optional.

***

**MQTTTransport.reconnect()**

Connect again using the same options as connect()

***

**MQTTTransport.onConnect(cb)**

- cb: handle successful (re)connection.

***

**MQTTTransport.setWill(will)**

Set will option before connection to broker. `Object`

`topic`: the topic to publish
`payload`: the message to publish
`qos`: the QoS
`retain`: the retain flag

***

**MQTTTransport.isConnected()**

Check is connected to broker

Returns: `Boolean`

### Events

***

**'connect'**

`function (connack) {}`

Emitted on successful (re)connection (i.e. connack rc=0).

- `connack` received connack packet. When `clean` connection option is `false` and server has a previous session
  for `clientId` connection option, then `connack.sessionPresent` flag is `true`. When that is the case,
  you may rely on stored session and prefer not to send subscribe commands for the client.

***

**'reconnect'**

`function () {}`

Emitted when a reconnect starts.

***

**'close'**

`function () {}`

Emitted after a disconnection.

***

**'disconnect'**

`function (packet) {}`

Emitted after receiving disconnect packet from broker. MQTT 5.0 feature.

***

**'offline'**

`function () {}`

Emitted when the client goes offline.

***

**'error'**

`function (error) {}`

Emitted when the client cannot connect (i.e. connack rc != 0) or when a
parsing error occurs.

The following TLS errors will be emitted as an `error` event:

- `ECONNREFUSED`
- `ECONNRESET`
- `EADDRINUSE`
- `ENOTFOUND`

***

**'end'**

`function () {}`

Emitted when [`mqtt.Client#end()`](#end) is called.
If a callback was passed to `mqtt.Client#end()`, this event is emitted once the
callback returns.

***

**'message'**

`function (topic, message, packet) {}`

Emitted when the client receives a publish packet

- `topic` topic of the received packet
- `message` payload of the received packet
- `packet` received packet, as defined in
  [mqtt-packet](https://github.com/mcollina/mqtt-packet#publish)

***

**'packetsend'**

`function (packet) {}`

Emitted when the client sends any packet. This includes .published() packets
as well as packets used by MQTT for managing subscriptions and connections

- `packet` received packet, as defined in
  [mqtt-packet](https://github.com/mcollina/mqtt-packet)

***

**'packetreceive'**

`function (packet) {}`

Emitted when the client receives any packet. This includes packets from
subscribed topics as well as packets used by MQTT for managing subscriptions
and connections

- `packet` received packet, as defined in
  [mqtt-packet](https://github.com/mcollina/mqtt-packet)

***