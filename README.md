# wio-setup

CLI module for setting up wio-node.

## Requirement
### node version
  - v6.10.3 or later

### Operation System
  - macOS
  - Windows10 (Creators Update or later) 
    - CommandPrompt
    - Bash on Ubuntu on Windows

### Wio Device
  - Wio Node<br>
\# Wio Link is not supported (I don't have it...)

## Install
```
$ npm install -g wio-setup
```

## Usage

```shell-session
$ wio-setup -h

  Usage: wio-setup [options]

  Options:

    -h, --help              output usage information
    -V, --version           output the version number
    -e, --email [value]     email address
    -p, --password [value]  password
    -S, --server [value]    server to login (server is 'https://us.wio.seeed.io' when this option is unspecified)
    -s, --wifiSsid [value]  wifi ssid
    -P, --wifiPwd [value]   wifi password
    -n, --wioName [value]   wio-node name
    -l, --list              list your wio-node
    -d, --delete [sn of wionode]  delete wio-node specified by SN
```
### Examples
for setting up

```shell-session
$ wio-setup
```

for setting up (login to china server)

```shell-session
$ wio-setup --server https://cn.wio.seeed.io
```

for listing your wio-node

```shell-session
$ wio-setup -l
```