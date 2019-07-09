const SamsungMultiroom = require('samsung-multiroom')

const within = (low, val, high) => Math.max(low, Math.min(val, high))

const promisify = fn => new Promise((ok, fail) =>
  fn((err, val) => err ? fail(err) : ok(val))
)

const failOnFalse = bool =>
  bool || Promise.reject(new Error('Could not set'))

const setMuteWith = (sm, mute) =>
  promisify(sm.setMute.bind(sm, mute)).then(failOnFalse)
const getVolWith = sm =>
  promisify(sm.getVolume.bind(sm))
const setVolWith = (sm, lvl) =>
  promisify(sm.setVolume.bind(sm, within(0, lvl, 100))).then(failOnFalse)
const getMuteWith = sm =>
  promisify(sm.getMute.bind(sm))

const handlers = sm => ({
  setVol(str) {
    const lvl = parseInt(str)
    return (/^\d{1,3}%$/).exec(str) &&
      !isNaN(lvl) &&
      setVolWith(sm, lvl)
  },
  mute: str => str === 'mute' && setMuteWith(sm, true),
  unmute: str => str === 'unmute' && setMuteWith(sm, false),
  toggleMute: str =>
    str === 'toggleMute' &&
    getMuteWith(sm).then(mute => setMuteWith(sm, !mute)
      .then(() => mute ? 'Unmuted' : 'Muted')
    ),
  getVol: str => str === 'volume' && getVolWith(sm).then(s => s+'%'),
  get: str =>
    !str && Promise.all([getVolWith(sm), getMuteWith(sm)])
      .then(([vol, mute]) => mute ? 'Mute' : `${vol}%`),
  inc: val =>
    (/^(-|\+)?\d{1,2}$/).exec(val) &&
    getVolWith(sm)
      .then(vol => setVolWith(sm, +vol + +val)),
  help: str => str === '--help' && Promise.resolve(
    'multiroom [mute|unmute|toggleMute|volume|\\d{,2}|\\d{,2}%|--help]'
  ),
})

const main = (sm, arg) => {
  const { setVol, mute, unmute, getVol, get, inc, help, toggleMute } = handlers(sm)
  return get(arg) ||
         inc(arg) ||
         setVol(arg) ||
         getVol(arg) ||
         mute(arg) ||
         unmute(arg) ||
         toggleMute(arg) ||
         help(arg) ||
         Promise.reject(new Error(`Invalid usage arg: "${arg}", see --help`))
}

main(new SamsungMultiroom({ host: process.env.MULTIROOM_HOST }), process.argv[2])
  .then(res => typeof res === 'string' && console.log(res))
  .catch(err => console.error(err.message) || process.exit(1))
