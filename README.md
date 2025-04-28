# multi-vlc

Control multiple [VLC](http://videolan.org) instances with only one web
interface.

## Usage

### Start VLC instances

```shell
vlc --extraintf rc --rc-host 127.0.0.1:8080
```

To run multiple instances on one host you can define different ports:

```shell
vlc --extraintf rc --rc-host 127.0.0.1:8080
vlc --extraintf rc --rc-host 127.0.0.1:8081
vlc --extraintf rc --rc-host 127.0.0.1:8082
```

### Start the server

Write all your clients into `clients.js`, e.g:

```javascript
module.exports =
[
  { name: "Laptop1", host: '192.168.11.3',  port:'8081' },
  { name: "Laptop2", host: '192.168.11.3',  port:'8082' },
  { name: "Desktop", host: '192.168.11.99', port:'8080' }
]
```

Then run the server:

```
node lib/server.js
```

### Open webinterface

Open a browser and enter the IP address of your server
and append the port 3000, e.g. `http://192.168.0.100:3000`.

## License

This project is licensed unter the MIT license.
