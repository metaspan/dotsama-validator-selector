# dotsama-validator-selector
Process &amp; Tools to select validators with high returns
At metaspan.com we use this process to ensure our Kusama Nomination Pool #50 has the highest possilble returns.

## Config

create a `.env` file with 

```
MONGO_HOST='192.168.1.100'
MONGO_PORT='12345'
MONGO_USERID='your_mongo_user'
MONGO_PASSWD='your_mongo_pass'
MONGO_DATABASE='your_mongo_db'
BATCH_SIZE=256
```

edit the `endpoints.js` file
- if you have a local node, please use that!

## Process

- Download ONE-T gz files from Element and unzip to ./data directory
- Clear out `<chain>-*.json` cache files to ./archive
- Update Nominators from chain
- Update Nominator Identity from chain
- Calculate unique nominators, and determine validators from `targets`
- Update known Validators - see https://github.com/turboflakes/one-t/issues/3

## TODO

- check balances of nominators to oversubscibed, if our balance is bigger we can push them off
- get better data from ONE-T upstream service - https://github.com/turboflakes/one-t/issues/3

# Selector

```bash
node selector.js -h

Usage: selector [OPTIONS]...

Options:
  -v, --version              output the version number
  -c, --chain <chain>        kusama | polkadot, defaults to kusama (default: "kusama")
  -d, --data                 Data directory, defaults to ./data
  -e, --endpoint <provider>  Endpoint provider, defaults to parity (default: "local")
  -l, --loglevel <level>     Logging level, defaults to info (default: "info")
  -p, --prefix               File prefix, defaults to onet_
  -t, --top <number>         \# vals in file to compare (default: "25")
  -m, --maxcommission        Maximim validator commission permitted, default 10
  -h, --help                 display help for command
```

# Support us

Please feel free to nominate our METASPAN validators directly, or select our pool #50 to get the same rewards

# References & Kudos

- we are dependent on the ONE-T service from turboflakes.io. Please also support them where possible
