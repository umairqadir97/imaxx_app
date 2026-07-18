import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Soundscape {
  id: string;
  name: string;
  iconName: string;
  isPremium: boolean;
  description: string;
  baseColor: string;
}

export interface Scenario {
  id: string;
  name: string;
  category: 'focus' | 'relax' | 'sleep';
  isPremium: boolean;
}

export interface AudioState {
  isPlaying: boolean;
  activeSoundscape: string;
  activeScenarioId: string | null;
  volume: number;
  blockApps: boolean;
  blendAudio: boolean;
  timerDuration: number; // in seconds
  timerTimeLeft: number;  // in seconds
  timerIsActive: boolean;
  isPremiumUnlocked: boolean;
  isMiniPlayerDismissed: boolean;
  timerMode: 'pomo' | 'short_break' | 'long_break';
  animationStyle: 'flip' | 'falling' | 'orb';
  activeSubScreen: 'timer' | 'stats' | 'trend';
  completedPomodorosCount: number;
  totalFocusSeconds: number;
  weeklyFocusMinutes: number[]; // Sunday to Saturday focus stats
  categoryFocusSeconds: Record<string, number>; // Focus category tracking
  soundscapesList: Soundscape[];
  scenariosList: Scenario[];
  focusType: 'pomodoro' | 'quick';
  pomoFocusDuration: number; // in seconds (e.g. 1500 for 25m)
  pomoBreakDuration: number; // in seconds (e.g. 300 for 5m)
  alertPreference: 'haptic' | 'sound' | 'both' | 'none';
  focusCategory: string;
  // Session cycling
  sessionTotalSeconds: number;     // total session goal in seconds
  sessionElapsedSeconds: number;   // how many seconds consumed so far
  currentPhase: 'focus' | 'break'; // which phase is running
  sessionActive: boolean;          // a full session (focus+break cycles) is underway
  hasActiveAudioSession: boolean;
  isYTAdPlaying: boolean;
}

const initialSoundscapes: Soundscape[] = [
  { id: 'focus', name: 'Focus', iconName: 'grid', isPremium: false, description: 'Deep concentration & flow states', baseColor: '#9B7EDE' },
  { id: 'relax', name: 'Relax', iconName: 'orbit', isPremium: false, description: 'Calm the mind & ease anxiety', baseColor: '#4ECDC4' },
  { id: 'sleep', name: 'Sleep', iconName: 'moon', isPremium: false, description: 'Soothing sounds for restful sleep', baseColor: '#7B5FB5' },
  { id: 'move', name: 'Move', iconName: 'arrows', isPremium: false, description: 'Engage energy & drive movement', baseColor: '#FFB347' },
  { id: 'uplift', name: 'Uplift', iconName: 'sun', isPremium: true, description: 'Boost mood & mental energy', baseColor: '#C4A8F5' },
];

const initialScenarios: Scenario[] = [
  // Focus category
  { id: 'focus_1', name: 'ADHD Deep Flow', category: 'focus', isPremium: false },
  { id: 'focus_2', name: 'Gamma Concentration', category: 'focus', isPremium: false },
  { id: 'focus_3', name: 'Circadian Flow Sync', category: 'focus', isPremium: false },
  { id: 'focus_4', name: 'Ultradian Work Rhythm', category: 'focus', isPremium: false },

  // Sleep category
  { id: 'sleep_1', name: 'Theta Dreamscape', category: 'sleep', isPremium: false },
  { id: 'sleep_2', name: 'Lunar Sleep Cradle', category: 'sleep', isPremium: false },
  { id: 'sleep_3', name: 'Ocean Twilight', category: 'sleep', isPremium: false },
  { id: 'sleep_4', name: 'Cosmic Star Rest', category: 'sleep', isPremium: false },

  // Frequencies category
  { id: 'freq_1', name: '528Hz Solfeggio', category: 'focus', isPremium: false },
  { id: 'freq_2', name: '432Hz Cosmic Calm', category: 'focus', isPremium: false },
  { id: 'freq_3', name: '40Hz Gamma Focus', category: 'focus', isPremium: false },
  { id: 'freq_4', name: '8Hz Theta Sleep', category: 'focus', isPremium: false },

  // Nature category
  { id: 'nature_1', name: 'Forest Wind Whispers', category: 'relax', isPremium: false },
  { id: 'nature_2', name: 'Campfire Logs Crackle', category: 'relax', isPremium: false },
  { id: 'nature_3', name: 'Somatic River Calmer', category: 'relax', isPremium: false },
  { id: 'nature_4', name: 'Mountain Ocean Tide', category: 'relax', isPremium: false },

  // Rain category
  { id: 'rain_1', name: 'Cozy Attic Storm', category: 'relax', isPremium: false },
  { id: 'rain_2', name: 'Rainforest Shower', category: 'relax', isPremium: false },
  { id: 'rain_3', name: 'Soft Summer Drizzle', category: 'relax', isPremium: false },
  { id: 'rain_4', name: 'Thunderstorm Sleep', category: 'relax', isPremium: false },

  // Relaxing category
  { id: 'relax_1', name: 'Zen Temple Bowl', category: 'relax', isPremium: false },
  { id: 'relax_2', name: 'Bilateral EMDR Sync', category: 'relax', isPremium: false },
  { id: 'relax_3', name: 'Anxiety Rescue Wave', category: 'relax', isPremium: false },
  { id: 'relax_4', name: 'Somatic Calm Sound', category: 'relax', isPremium: false }
];

const initialState: AudioState = {
  isPlaying: false,
  activeSoundscape: 'relax',
  activeScenarioId: null,
  volume: 0.8,
  blockApps: false,
  blendAudio: false,
  timerDuration: 1500, // 25 min default
  timerTimeLeft: 1500,
  timerIsActive: false,
  isPremiumUnlocked: false,
  isMiniPlayerDismissed: false,
  hasActiveAudioSession: false,
  timerMode: 'pomo',
  animationStyle: 'falling',
  activeSubScreen: 'timer',
  completedPomodorosCount: 3020, // matching focus stats in Image 4
  totalFocusSeconds: 1540 * 3600, // matching 1540h total in Image 4
  weeklyFocusMinutes: [372, 360, 455, 385, 387, 0, 0], // S, M, T, W, T, F, S
  categoryFocusSeconds: {
    Work: 600 * 3600,
    Study: 450 * 3600,
    Meditate: 120 * 3600,
    Fitness: 80 * 3600,
    Code: 200 * 3600,
    Relax: 90 * 3600,
  },
  soundscapesList: initialSoundscapes,
  scenariosList: initialScenarios,
  focusType: 'pomodoro',
  pomoFocusDuration: 1500,
  pomoBreakDuration: 300,
  alertPreference: 'both',
  focusCategory: 'Work',
  sessionTotalSeconds: 3600,    // default 1 hour total session
  sessionElapsedSeconds: 0,
  currentPhase: 'focus',
  sessionActive: false,
  isYTAdPlaying: false,
};

const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    togglePlayback: (state) => {
      if (state.timerIsActive) {
        // Pausing: stop the timer tick but keep session alive
        state.isPlaying = false;
        state.timerIsActive = false;
      } else {
        state.isPlaying = !state.isPlaying;
      }
      if (state.isPlaying) {
        state.hasActiveAudioSession = true;
        state.isMiniPlayerDismissed = false;
      }
    },
    playAudio: (state) => {
      state.isPlaying = true;
      state.hasActiveAudioSession = true;
      state.isMiniPlayerDismissed = false;
    },
    pauseAudio: (state) => {
      state.isPlaying = false;
      state.timerIsActive = false;
    },
    resetAudioState: (state) => {
      state.isPlaying = false;
      state.activeScenarioId = null;
      state.hasActiveAudioSession = false;
      state.timerIsActive = false;
    },
    setSoundscape: (state, action: PayloadAction<string>) => {
      state.activeSoundscape = action.payload;
      state.activeScenarioId = null;
      state.isPlaying = false;
      state.isMiniPlayerDismissed = false; // Show player again
      state.hasActiveAudioSession = true;
    },
    setScenario: (state, action: PayloadAction<string>) => {
      const scenario = state.scenariosList.find(s => s.id === action.payload);
      if (scenario) {
        state.activeScenarioId = scenario.id;
        state.activeSoundscape = scenario.category;
        state.isPlaying = true;
        state.isMiniPlayerDismissed = false; // Show player again
        state.hasActiveAudioSession = true;
      }
    },
    setYTAdPlaying: (state, action: PayloadAction<boolean>) => {
      state.isYTAdPlaying = action.payload;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = Math.max(0, Math.min(1, action.payload));
    },
    toggleBlockApps: (state) => {
      state.blockApps = !state.blockApps;
    },
    toggleBlendAudio: (state) => {
      state.blendAudio = !state.blendAudio;
    },
    startTimer: (state, action: PayloadAction<number>) => {
      state.timerDuration = action.payload;
      state.timerTimeLeft = action.payload;
      state.timerIsActive = true;
      state.isPlaying = true;
      state.isMiniPlayerDismissed = false; // Show player again
      state.hasActiveAudioSession = true;
    },
    // Start a full session (resets elapsed time, sets total, begins focus phase)
    startSession: (state, action: PayloadAction<{ focusDuration: number; sessionTotal: number }>) => {
      const { focusDuration, sessionTotal } = action.payload;
      state.sessionTotalSeconds = sessionTotal;
      state.sessionElapsedSeconds = 0;
      state.currentPhase = 'focus';
      state.sessionActive = true;
      state.timerDuration = focusDuration;
      state.timerTimeLeft = focusDuration;
      state.timerIsActive = true;
      state.isPlaying = true;
      state.isMiniPlayerDismissed = false;
      state.hasActiveAudioSession = true;
    },
    tickTimer: (state) => {
      if (state.timerIsActive && state.timerTimeLeft > 0) {
        state.timerTimeLeft -= 1;
        if (state.sessionActive) {
          state.sessionElapsedSeconds += 1;
        }
        if (state.timerTimeLeft === 0) {
          // Phase complete — auto-advance handled in component via useEffect
          state.timerIsActive = false;
          if (!state.sessionActive) {
            state.isPlaying = false;
          }
          if (state.currentPhase === 'focus') {
            state.completedPomodorosCount += 1;
          }
        }
      }
    },
    // Auto-advance to next phase (called from component after timer hits 0)
    advancePhase: (state) => {
      if (!state.sessionActive) return;
      // Check if overall session goal is met
      if (state.sessionElapsedSeconds >= state.sessionTotalSeconds) {
        state.sessionActive = false;
        state.timerIsActive = false;
        state.isPlaying = false;
        return;
      }
      // Flip phase
      if (state.currentPhase === 'focus') {
        state.currentPhase = 'break';
        state.timerDuration = state.pomoBreakDuration;
        state.timerTimeLeft = state.pomoBreakDuration;
      } else {
        state.currentPhase = 'focus';
        state.timerDuration = state.pomoFocusDuration;
        state.timerTimeLeft = state.pomoFocusDuration;
      }
      state.timerIsActive = true;
      state.isPlaying = true;
    },
    stopSession: (state) => {
      state.sessionActive = false;
      state.timerIsActive = false;
      state.isPlaying = false;
      state.timerTimeLeft = state.timerDuration;
      state.sessionElapsedSeconds = 0;
      state.currentPhase = 'focus';
    },
    // Resume a paused session — re-activates timer with remaining time
    resumeSession: (state) => {
      if (state.sessionActive && !state.timerIsActive && state.timerTimeLeft > 0) {
        state.timerIsActive = true;
        state.isPlaying = true;
      }
    },
    stopTimer: (state) => {
      state.timerIsActive = false;
      state.timerTimeLeft = state.timerDuration;
    },
    unlockPremium: (state) => {
      state.isPremiumUnlocked = true;
    },
    lockPremium: (state) => {
      state.isPremiumUnlocked = false;
    },
    dismissMiniPlayer: (state) => {
      state.isMiniPlayerDismissed = true;
      state.isPlaying = false;
      state.timerIsActive = false;
      state.hasActiveAudioSession = false;
    },
    setTimerMode: (state, action: PayloadAction<'pomo' | 'short_break' | 'long_break'>) => {
      state.timerMode = action.payload;
      state.timerIsActive = false;
      state.isPlaying = false;
      
      let duration = 1800; // 30 mins pomo (Image 2)
      if (action.payload === 'short_break') duration = 300; // 5 mins
      if (action.payload === 'long_break') duration = 900; // 15 mins
      
      state.timerDuration = duration;
      state.timerTimeLeft = duration;
    },
    setAnimationStyle: (state, action: PayloadAction<'flip' | 'falling' | 'orb'>) => {
      state.animationStyle = action.payload;
    },
    setActiveSubScreen: (state, action: PayloadAction<'timer' | 'stats' | 'trend'>) => {
      state.activeSubScreen = action.payload;
    },
    addFocusSeconds: (state, action: PayloadAction<number>) => {
      state.totalFocusSeconds += action.payload;
      // Add to today's index in weeklyFocusMinutes (S, M, T, W, T, F, S)
      const dayIdx = new Date().getDay(); // 0 is Sunday
      if (dayIdx >= 0 && dayIdx < 7) {
        state.weeklyFocusMinutes[dayIdx] += Math.floor(action.payload / 60);
      }
      // Add to active category focus seconds
      const cat = state.focusCategory || 'Work';
      if (!state.categoryFocusSeconds) {
        state.categoryFocusSeconds = { Work: 600*3600, Study: 450*3600, Meditate: 120*3600, Fitness: 80*3600, Code: 200*3600, Relax: 90*3600 };
      }
      state.categoryFocusSeconds[cat] = (state.categoryFocusSeconds[cat] || 0) + action.payload;
    },
    incrementCompletedPomodoros: (state) => {
      state.completedPomodorosCount += 1;
    },
    hydrateAudio: (state, action: PayloadAction<any>) => {
      return {
        ...state,
        ...action.payload
      };
    },
    setFocusType: (state, action: PayloadAction<'pomodoro' | 'quick'>) => {
      state.focusType = action.payload;
    },
    setPomoFocusDuration: (state, action: PayloadAction<number>) => {
      state.pomoFocusDuration = action.payload;
      if (state.focusType === 'pomodoro' && state.timerMode === 'pomo') {
        state.timerDuration = action.payload;
        if (!state.timerIsActive) {
          state.timerTimeLeft = action.payload;
        }
      }
    },
    setPomoBreakDuration: (state, action: PayloadAction<number>) => {
      state.pomoBreakDuration = action.payload;
      if (state.focusType === 'pomodoro' && state.timerMode !== 'pomo') {
        state.timerDuration = action.payload;
        if (!state.timerIsActive) {
          state.timerTimeLeft = action.payload;
        }
      }
    },
    setAlertPreference: (state, action: PayloadAction<'haptic' | 'sound' | 'both' | 'none'>) => {
      state.alertPreference = action.payload;
    },
    setFocusCategory: (state, action: PayloadAction<string>) => {
      state.focusCategory = action.payload;
    },
    setSessionTotalSeconds: (state, action: PayloadAction<number>) => {
      state.sessionTotalSeconds = action.payload;
    },
  },
});

export const {
  togglePlayback,
  playAudio,
  pauseAudio,
  setSoundscape,
  setScenario,
  setYTAdPlaying,
  resetAudioState,
  setVolume,
  toggleBlockApps,
  toggleBlendAudio,
  startTimer,
  startSession,
  tickTimer,
  stopTimer,
  stopSession,
  resumeSession,
  advancePhase,
  unlockPremium,
  lockPremium,
  dismissMiniPlayer,
  setTimerMode,
  setAnimationStyle,
  setActiveSubScreen,
  addFocusSeconds,
  incrementCompletedPomodoros,
  hydrateAudio,
  setFocusType,
  setPomoFocusDuration,
  setPomoBreakDuration,
  setAlertPreference,
  setFocusCategory,
  setSessionTotalSeconds,
} = audioSlice.actions;

export default audioSlice.reducer;
