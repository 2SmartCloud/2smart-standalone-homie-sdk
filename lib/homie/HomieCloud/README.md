# HomieCloud

## API

- HomieCloud(options)
- HomieCloud.init()
- HomieCloud.createNewHomie(rootTopic)
***

**HomieCloud(options)**

Create HomieCloud instance.
This instance use an [EventCache](../../utils/EventCache.js) to handle and process messages.
`EventCache` isntance collects a set of messages and then process a batch of collected messages.
The trigger to start processing could be a debounce call (`cacheDebounceMs` option) or when the max cache size is reached (`eventCacheSize` option).

- options:
    - transport: Transport instance. One of [Broker](../../Broker)
    - debug: any logger that respects [Debugger](../../utils/README.md) interface
    - cacheDebounceMs: An option for [EventCache](../../utils/EventCache.js). `100` by default.
    - eventCacheSize: An option for [EventCache](../../utils/EventCache.js). `10000` by default.

***

**HomieCloud.init()**

Connect trasport and subscribe to all topics (`#` subscription).

***

**HomieCloud.createNewHomie(rootTopic)**

- rootTopic: a root topic for the homie instance `String`

Creates new homie instance with provided root topic and emits "new_homie" event.
This event will be triggered, when HomieCloud receive a topic with a user's root topic, which is not initialized yet.
An example of multi-user topics:
```
<user-1>/sweet-home/<device-id>/<node-id>/...
<user-2>/sweet-home/<device-id>/<node-id>/...
<user-3>/sweet-home/<device-id>/<node-id>/...
<user-4>/sweet-home/<device-id>/<node-id>/...
```
In such scenario, HomieCloud will create 4 [Homie](../Homie/README.md) instances for `<user-1>`, `<user-2>`, `<user-3>`, `<user-4>`.

This [Homie](../Homie/README.md) instance will use the same transport instance which HomieCloud is using.

Returns: [Homie](../homie/README.md)

