import { useEffect, useRef, useState } from 'react'
import {
  AudioLines,
  Check,
  ChevronDown,
  Disc3,
  Heart,
  ListMusic,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Plus,
  Repeat,
  Repeat1,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

function App() {
  const audioRef = useRef(null)
  const inputRef = useRef(null)
  const [tracks, setTracks] = useState([])
  const tracksRef = useRef(tracks)
  const [activeId, setActiveId] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.78)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off')
  const [autoplay, setAutoplay] = useState(true)
  const [favorites, setFavorites] = useState(() => new Set())
  const [dragging, setDragging] = useState(false)

  const activeIndex = tracks.findIndex((track) => track.id === activeId)
  const activeTrack = tracks[activeIndex] ?? null

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !activeTrack) return
    audio.src = activeTrack.url
    audio.load()
    setCurrentTime(0)
    setDuration(0)
    if (playing) audio.play().catch(() => setPlaying(false))
  }, [activeId])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    audio.muted = muted
  }, [volume, muted])

  useEffect(() => () => tracksRef.current.forEach((track) => URL.revokeObjectURL(track.url)), [])

  const addFiles = (files) => {
    const audioFiles = Array.from(files).filter((file) => file.type.startsWith('audio/'))
    if (!audioFiles.length) return
    const additions = audioFiles.map((file) => ({
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Local file',
      album: 'Your library',
      url: URL.createObjectURL(file),
      duration: 0,
      fileSize: file.size,
    }))
    setTracks((current) => {
      if (!current.length) setActiveId(additions[0].id)
      return [...current, ...additions]
    })
  }

  const selectTrack = (track) => {
    setActiveId(track.id)
    setPlaying(true)
    requestAnimationFrame(() => audioRef.current?.play().catch(() => setPlaying(false)))
  }

  const stepTrack = (direction) => {
    if (tracks.length < 2) {
      if (activeTrack && direction < 0) {
        audioRef.current.currentTime = 0
        setCurrentTime(0)
      }
      return
    }
    let nextIndex
    if (shuffle) {
      do nextIndex = Math.floor(Math.random() * tracks.length)
      while (nextIndex === activeIndex)
    } else {
      nextIndex = (activeIndex + direction + tracks.length) % tracks.length
    }
    setActiveId(tracks[nextIndex].id)
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!activeTrack || !audio) {
      inputRef.current?.click()
      return
    }
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  const toggleFavorite = (id) => {
    setFavorites((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const removeTrack = (track) => {
    const nextTracks = tracks.filter((item) => item.id !== track.id)
    setTracks(nextTracks)
    URL.revokeObjectURL(track.url)
    setFavorites((current) => {
      const next = new Set(current)
      next.delete(track.id)
      return next
    })
    if (track.id === activeId) {
      setPlaying(false)
      setActiveId(nextTracks[0]?.id ?? null)
    }
  }

  const handleEnded = () => {
    if (repeat === 'one') {
      audioRef.current.currentTime = 0
      audioRef.current.play()
      return
    }
    if (autoplay && tracks.length > 1) stepTrack(1)
    else setPlaying(false)
  }

  const progress = duration ? (currentTime / duration) * 100 : 0
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.45 ? Volume1 : Volume2

  return (
    <div className="app-shell min-h-screen text-white" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files) }}>
      <audio
        ref={audioRef}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const trackDuration = event.currentTarget.duration
          setDuration(trackDuration)
          setTracks((current) => current.map((track) => track.id === activeId ? { ...track, duration: trackDuration } : track))
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={handleEnded}
      />

      <aside className="sidebar hidden lg:flex">
        <a className="wordmark" href="#top" aria-label="Afterhours home">
          <span className="brand-mark"><AudioLines size={19} strokeWidth={2.2} /></span>
          <span>afterhours<span className="wordmark-dot">.</span></span>
        </a>
        <div className="sidebar-label">YOUR SPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-link nav-link-active" href="#library"><Disc3 size={17} /> My library</a>
          <a className="nav-link" href="#queue"><ListMusic size={17} /> Queue <span className="nav-count">{tracks.length}</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><span className="note-dot" /> LOCAL LIBRARY</div>
          <p>Your music stays yours.<br />Nothing leaves this device.</p>
        </div>
      </aside>

      <main id="top" className="main-area">
        <header className="topbar">
          <div className="mobile-brand lg:hidden"><span className="brand-mark"><AudioLines size={17} /></span> afterhours<span className="wordmark-dot">.</span></div>
          <div className="breadcrumb hidden sm:flex"><span>YOUR SPACE</span><span className="crumb-slash">/</span><strong>MY LIBRARY</strong></div>
          <button className="import-button" onClick={() => inputRef.current?.click()}>
            <Plus size={16} strokeWidth={2.5} /><span>Import music</span>
          </button>
          <input ref={inputRef} className="sr-only" type="file" accept="audio/*" multiple onChange={(event) => { addFiles(event.target.files); event.target.value = '' }} />
        </header>

        <div className="content-wrap">
          <section className="intro-row" id="library">
            <div className="intro-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL LISTENING ROOM</div>
              <h1>Good music.<br /><span>Good company.</span></h1>
              <p className="intro-subtitle">A little space for the songs that stay with you.</p>
            </div>
            <div className="library-stat"><span className="stat-number">{String(tracks.length).padStart(2, '0')}</span><span className="stat-caption">TRACKS<br />IN YOUR LIBRARY</span></div>
          </section>

          <section className="listening-grid">
            <div className="now-panel">
              <div className="section-heading"><span>NOW PLAYING</span><span className="live-indicator"><i /> {playing ? 'LIVE' : 'READY'}</span></div>
              <div className={`cover-art ${activeTrack ? 'cover-loaded' : ''}`}>
                {activeTrack?.artwork ? <img src={activeTrack.artwork} alt="Album cover" /> : <>
                  <div className="cover-orbit orbit-one" /><div className="cover-orbit orbit-two" />
                  <div className="cover-sun" />
                  <span className="cover-index">AH—001</span>
                  <span className="cover-word">SOUND<br />IN COLOR</span>
                  <span className="cover-foot">AN OPEN COLLECTION · SIDE A</span>
                </>}
                <div className="cover-grain" />
                {playing && <div className="cover-playing"><span /><span /><span /><span /><span /></div>}
              </div>
              <div className="track-meta-row">
                <div className="track-copy">
                  <div className="track-title">{activeTrack?.title ?? 'The room is yours'}</div>
                  <div className="track-artist">{activeTrack?.artist ?? 'Add a song to begin listening'}</div>
                </div>
                <button className={`icon-button favorite-main ${activeTrack && favorites.has(activeTrack.id) ? 'is-favorite' : ''}`} aria-label={activeTrack && favorites.has(activeTrack.id) ? 'Remove from favorites' : 'Add to favorites'} title="Add to favorites" disabled={!activeTrack} onClick={() => activeTrack && toggleFavorite(activeTrack.id)}>
                  <Heart size={19} fill={activeTrack && favorites.has(activeTrack.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="progress-area">
                <input className="seek-slider" aria-label="Seek" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 0)} style={{ '--progress': `${progress}%` }} onChange={(event) => { const value = Number(event.target.value); audioRef.current.currentTime = value; setCurrentTime(value) }} disabled={!activeTrack} />
                <div className="time-labels"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
              </div>
              <div className="transport-row">
                <button className={`icon-button transport-aux ${shuffle ? 'control-active' : ''}`} aria-label="Toggle shuffle" title="Shuffle" onClick={() => setShuffle(!shuffle)}><Shuffle size={17} /></button>
                <button className="icon-button transport-skip" aria-label="Previous track" title="Previous track" onClick={() => stepTrack(-1)} disabled={!activeTrack}><SkipBack size={20} fill="currentColor" /></button>
                <button className="play-button" aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>{playing ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}</button>
                <button className="icon-button transport-skip" aria-label="Next track" title="Next track" onClick={() => stepTrack(1)} disabled={!activeTrack}><SkipForward size={20} fill="currentColor" /></button>
                <button className={`icon-button transport-aux ${repeat !== 'off' ? 'control-active' : ''}`} aria-label={`Repeat ${repeat}`} title={`Repeat: ${repeat}`} onClick={() => setRepeat((value) => value === 'off' ? 'all' : value === 'all' ? 'one' : 'off')}>{repeat === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}</button>
              </div>
              <div className="volume-row">
                <div className="volume-control"><button className="icon-button volume-icon" aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted(!muted)}><VolumeIcon size={17} /></button><input aria-label="Volume" className="volume-slider" type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} style={{ '--progress': `${(muted ? 0 : volume) * 100}%` }} onChange={(event) => { setVolume(Number(event.target.value)); setMuted(false) }} /></div>
                <button className={`autoplay-toggle ${autoplay ? 'toggle-on' : ''}`} onClick={() => setAutoplay(!autoplay)} aria-pressed={autoplay}><span className="toggle-dot" /> AUTOPLAY</button>
              </div>
            </div>

            <section className={`queue-panel ${dragging ? 'queue-dragging' : ''}`} id="queue" onDragEnter={() => setDragging(true)} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }}>
              <div className="queue-header">
                <div><div className="section-heading"><span>UP NEXT</span><span className="queue-count">{String(tracks.length).padStart(2, '0')}</span></div><h2>Your queue<span className="heading-period">.</span></h2></div>
                <button className="queue-add" onClick={() => inputRef.current?.click()} aria-label="Add tracks" title="Add tracks"><Plus size={18} /></button>
              </div>
              <div className="queue-toolbar"><span>TRACK</span><span>LENGTH</span></div>
              {tracks.length ? <div className="track-list">
                {tracks.map((track, index) => {
                  const isActive = track.id === activeId
                  return <div className={`queue-track ${isActive ? 'queue-track-active' : ''}`} key={track.id}>
                    <button className="track-select" onClick={() => selectTrack(track)} aria-label={`Play ${track.title}`}>
                      <span className="track-number">{isActive && playing ? <span className="mini-equalizer"><i /><i /><i /></span> : String(index + 1).padStart(2, '0')}</span>
                      <span className="mini-cover"><Music2 size={16} /></span>
                      <span className="queue-track-text"><span className="queue-track-title">{track.title}</span><span className="queue-track-artist">{track.artist}</span></span>
                    </button>
                    <span className="queue-duration">{formatTime(track.duration)}</span>
                    <button className={`icon-button queue-heart ${favorites.has(track.id) ? 'is-favorite' : ''}`} aria-label={favorites.has(track.id) ? 'Remove from favorites' : 'Add to favorites'} onClick={() => toggleFavorite(track.id)}><Heart size={15} fill={favorites.has(track.id) ? 'currentColor' : 'none'} /></button>
                    <button className="icon-button queue-remove" aria-label={`Remove ${track.title}`} onClick={() => removeTrack(track)}><X size={15} /></button>
                  </div>
                })}
              </div> : <button className="empty-queue" onClick={() => inputRef.current?.click()}>
                <span className="empty-disc"><Disc3 size={30} strokeWidth={1.2} /></span>
                <span className="empty-title">Start with a song</span>
                <span className="empty-copy">Bring your own music.<br />Your files never leave this device.</span>
                <span className="empty-action"><Plus size={14} /> CHOOSE AUDIO FILES</span>
              </button>}
              <div className="queue-footer"><span><span className="footer-dot" /> {tracks.length ? `${tracks.length} ${tracks.length === 1 ? 'TRACK' : 'TRACKS'} IN QUEUE` : 'READY WHEN YOU ARE'}</span><button onClick={() => {
                if (!tracks.length) return
                tracks.forEach((track) => URL.revokeObjectURL(track.url))
                audioRef.current?.pause()
                setPlaying(false)
                setCurrentTime(0)
                setDuration(0)
                setActiveId(null)
                setTracks([])
              }} disabled={!tracks.length}>CLEAR QUEUE <ChevronDown size={13} /></button></div>
            </section>
          </section>

          <footer className="page-footer"><span>MADE FOR THE LONG WAY HOME</span><span>YOUR MUSIC · YOUR DEVICE · YOUR PACE</span></footer>
        </div>
      </main>
      <div className="mobile-dock lg:hidden">
        <div className="dock-track"><div className="dock-art"><Disc3 size={18} /></div><div className="dock-info"><span>{activeTrack?.title ?? 'Nothing playing yet'}</span><small>{activeTrack?.artist ?? 'Import a song to get started'}</small></div></div>
        <button className="dock-play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
        <div className="dock-progress"><span style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="drop-overlay" aria-hidden={!dragging}>
        <div className="drop-message"><Plus size={26} /><span>DROP YOUR MUSIC HERE</span></div>
      </div>
    </div>
  )
}

export default App