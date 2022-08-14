
import 'dotenv/config'
import { hexToString } from '@polkadot/util'

const MONGO_HOST = process.env.MONGO_HOST || 'localhost'
const MONGO_PORT = process.env.MONGO_PORT || '27017'
const MONGO_USERID = process.env.MONGO_USERID || 'mongo_user'
const MONGO_PASSWD = process.env.MONGO_PASSWD || 'mongo_pass'
const MONGO_DATABASE = process.env.MONGO_DATABASE || 'mongo_db'
const MONGO_CONNECTION_URL = `mongodb://${MONGO_USERID}:${MONGO_PASSWD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`
const CHUNKSIZE = process.env.CHUNKSIZE || 256

function getMongoUrl () {
  return MONGO_CONNECTION_URL
}

function getChunkSize () { return CHUNKSIZE }

function shortStash (stash, len=6) {
  return `${stash.slice(0, len)}...${stash.slice(-len)}`
}

function parseIdentity(id) {
  const idj = id.toJSON()
  // console.debug('idj', idj)
  if (idj) {
    return {
      deposit: idj.deposit,
      info: {
        // additional...
        display: idj.info.display.raw ? hexToString(idj.info.display.raw) : '',
        email: idj.info.email.raw ? hexToString(idj.info.email.raw) : '',
        // image...
        legal: idj.info.legal.raw ? hexToString(idj.info.legal.raw) : '',
        riot: idj.info.riot.raw ? hexToString(idj.info.riot.raw) : '',
        twitter: idj.info.twitter.raw ? hexToString(idj.info.twitter.raw) : '',
        web: idj.info.web.raw ? hexToString(idj.info.web.raw) : ''
      },
      judgements: idj.judgements
    }
  } else {
    return null
  }
}

function slog(text) {
  console.log(text)
}

export { getMongoUrl, getChunkSize, shortStash, parseIdentity, slog }
