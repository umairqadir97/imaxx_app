import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Habit {
  id: string;
  name: string;
  color: string; // Hex color code
  icon: string; // Icon identifier
  smallestUnit: string; // ADHD nano-habit (e.g., "Read 1 page", "1 min breathing")
  description: string;   // Optional description text (e.g. "Second Habit to track")
  createdDate: string; // ISO date
  completions: string[]; // List of ISO string dates (YYYY-MM-DD) when completed
  streakCount: number;
  maxStreak: number;
  
  // Advanced options matching HabitKit fields
  completionsPerDay: number; // e.g. 1/day, 2/day
  reminder: string;          // e.g. "None", "08:00 AM"
  streakGoal: string;        // e.g. "None", "5 days"
  category: string;        // e.g. "None", "Health"
  trackingType: 'step' | 'custom';
  isTask?: boolean;
}

export interface CoworkingRoom {
  id: string;
  name: string;
  participants: number;
  duration: number; // Duration of active session in minutes
  description: string;
}

export interface HabitState {
  habits: Habit[];
  dailyFocus: string;
  selectedStruggles: string[];
  isOnboardingCompleted: boolean;
  coworkingRooms: CoworkingRoom[];
  listeningTimeTotal: number; // in seconds
  focusScoreTotal: number; // accumulated focus points
  viewMode: 'grid' | 'list' | 'compact';
  habitsSubTab: 'tasks' | 'micro';
}

const defaultHabits: Habit[] = [
  {
    id: 'habit_1',
    name: 'Hydration Boost',
    color: '#4ECDC4',
    icon: 'droplets',
    smallestUnit: 'Drink 1 glass',
    description: 'Calm the mind with fresh water and hydration breaks',
    createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
    completions: [
      new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0],
    ],
    streakCount: 2,
    maxStreak: 3,
    completionsPerDay: 1,
    reminder: 'None',
    streakGoal: 'None',
    category: 'Health',
    trackingType: 'step',
    isTask: false,
  },
  {
    id: 'habit_2',
    name: 'Morning Mindfulness',
    color: '#9B7EDE',
    icon: 'brain',
    smallestUnit: 'Sit for 1 minute',
    description: 'ADHD morning grounding exercise',
    createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completions: [
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0],
    ],
    streakCount: 1,
    maxStreak: 1,
    completionsPerDay: 1,
    reminder: 'None',
    streakGoal: 'None',
    category: 'Mind',
    trackingType: 'step',
    isTask: false,
  },
  {
    id: 'habit_3',
    name: 'Get out of bed',
    color: '#FFB347',
    icon: 'moon',
    smallestUnit: 'Sit up and stretch',
    description: 'Break morning sleep inertia',
    createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completions: [
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0],
    ],
    streakCount: 3,
    maxStreak: 3,
    completionsPerDay: 1,
    reminder: 'None',
    streakGoal: 'None',
    category: 'Health',
    trackingType: 'step',
    isTask: true,
  },
  {
    id: 'habit_4',
    name: 'Wash my face',
    color: '#FF6B6B',
    icon: 'droplets',
    smallestUnit: 'Splash cold water',
    description: 'Instant nervous system reset',
    createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completions: [
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0],
    ],
    streakCount: 2,
    maxStreak: 2,
    completionsPerDay: 1,
    reminder: 'None',
    streakGoal: 'None',
    category: 'Health',
    trackingType: 'step',
    isTask: true,
  },
  {
    id: 'habit_5',
    name: 'Brush teeth',
    color: '#33A3FF',
    icon: 'star',
    smallestUnit: 'Brush for 2 minutes',
    description: 'Maintain dental hygiene',
    createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completions: [
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ],
    streakCount: 0,
    maxStreak: 1,
    completionsPerDay: 1,
    reminder: 'None',
    streakGoal: 'None',
    category: 'Health',
    trackingType: 'step',
    isTask: true,
  },
  {
    id: 'habit_6',
    name: 'Take 3 deep breaths',
    color: '#38EF7D',
    icon: 'wind',
    smallestUnit: 'Box breathing reset',
    description: 'Quiet the racing mind',
    createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completions: [],
    streakCount: 0,
    maxStreak: 0,
    completionsPerDay: 1,
    reminder: 'None',
    streakGoal: 'None',
    category: 'Mind',
    trackingType: 'step',
    isTask: true,
  },
  {
    id: 'habit_7',
    name: 'Do one happy thing',
    color: '#FF7EB9',
    icon: 'heart',
    smallestUnit: 'Listen to a song or stretch',
    description: 'Prioritize self-care dopamine',
    createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completions: [],
    streakCount: 0,
    maxStreak: 0,
    completionsPerDay: 1,
    reminder: 'None',
    streakGoal: 'None',
    category: 'Mind',
    trackingType: 'step',
    isTask: true,
  },
  {
    id: 'habit_8',
    name: 'Focus Deep Work',
    color: '#C4A8F5',
    icon: 'cpu',
    smallestUnit: 'Open doc & write 1 sentence',
    description: 'Overcome project starting paralysis',
    createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completions: [],
    streakCount: 0,
    maxStreak: 0,
    completionsPerDay: 1,
    reminder: 'None',
    streakGoal: 'None',
    category: 'Work',
    trackingType: 'step',
    isTask: false,
  },
];

const defaultRooms: CoworkingRoom[] = [
  { id: 'room_1', name: 'ADHD Deep Focus Cave', participants: 42, duration: 25, description: 'Quiet work space. Sync Pomodoro.' },
  { id: 'room_2', name: 'Chores & Admin Blitz', participants: 18, duration: 50, description: 'Micro-habits & household administrative items.' },
  { id: 'room_3', name: 'Creative Sandbox', participants: 27, duration: 45, description: 'Design, write, build. Ambient background sounds.' },
];

const initialState: HabitState = {
  habits: defaultHabits,
  dailyFocus: '',
  selectedStruggles: [],
  isOnboardingCompleted: false,
  coworkingRooms: defaultRooms,
  listeningTimeTotal: 12450, // mock base seconds (~3.5 hrs)
  focusScoreTotal: 78,
  viewMode: 'compact',
  habitsSubTab: 'tasks',
};

// Helper function to calculate streaks based on completions array
const calculateStreak = (completions: string[]): number => {
  if (completions.length === 0) return 0;
  
  // Deduplicate completions
  const uniqueDates = Array.from(new Set(completions));
  const sorted = [...uniqueDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  let streak = 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  if (!sorted.includes(todayStr) && !sorted.includes(yesterdayStr)) {
    return 0;
  }

  let expectedDate = sorted.includes(todayStr) ? new Date() : new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < sorted.length; i++) {
    const expStr = expectedDate.toISOString().split('T')[0];
    if (sorted.includes(expStr)) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

const habitSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {
    addHabit: (state, action: PayloadAction<Omit<Habit, 'id' | 'createdDate' | 'completions' | 'streakCount' | 'maxStreak'>>) => {
      const newHabit: Habit = {
        ...action.payload,
        id: `habit_${Date.now()}`,
        createdDate: new Date().toISOString().split('T')[0],
        completions: [],
        streakCount: 0,
        maxStreak: 0,
      };
      state.habits.push(newHabit);
    },
    hydrateHabits: (state, action: PayloadAction<any>) => {
      return {
        ...state,
        ...action.payload
      };
    },
    editHabit: (state, action: PayloadAction<Omit<Habit, 'createdDate' | 'completions' | 'streakCount' | 'maxStreak'>>) => {
      const { id, name, color, icon, smallestUnit, description, completionsPerDay, reminder, streakGoal, category, trackingType, isTask } = action.payload;
      const index = state.habits.findIndex(h => h.id === id);
      if (index > -1) {
        state.habits[index] = {
          ...state.habits[index],
          name,
          color,
          icon,
          smallestUnit,
          description,
          completionsPerDay,
          reminder,
          streakGoal,
          category,
          trackingType,
          isTask
        };
      }
    },
    toggleHabitCompletion: (state, action: PayloadAction<{ habitId: string; date: string }>) => {
      const { habitId, date } = action.payload;
      const habit = state.habits.find(h => h.id === habitId);
      if (habit) {
        const index = habit.completions.indexOf(date);
        if (index > -1) {
          // Remove completion
          habit.completions.splice(index, 1);
        } else {
          // Add completion
          habit.completions.push(date);
          state.focusScoreTotal += 5; // Add points for completing habit
        }
        
        // Re-calculate streaks
        habit.streakCount = calculateStreak(habit.completions);
        if (habit.streakCount > habit.maxStreak) {
          habit.maxStreak = habit.streakCount;
        }
      }
    },
    deleteHabit: (state, action: PayloadAction<string>) => {
      state.habits = state.habits.filter(h => h.id !== action.payload);
    },
    setDailyFocus: (state, action: PayloadAction<string>) => {
      state.dailyFocus = action.payload;
    },
    toggleStruggle: (state, action: PayloadAction<string>) => {
      const index = state.selectedStruggles.indexOf(action.payload);
      if (index > -1) {
        state.selectedStruggles.splice(index, 1);
      } else {
        state.selectedStruggles.push(action.payload);
      }
    },
    completeOnboarding: (state) => {
      state.isOnboardingCompleted = true;
    },
    resetOnboarding: (state) => {
      state.isOnboardingCompleted = false;
      state.selectedStruggles = [];
    },
    addListeningTime: (state, action: PayloadAction<number>) => {
      state.listeningTimeTotal += action.payload;
      if (state.listeningTimeTotal % 300 < action.payload) {
        state.focusScoreTotal += 1;
      }
    },
    updateCoworkingRoomParticipants: (state) => {
      state.coworkingRooms.forEach(room => {
        const delta = Math.floor(Math.random() * 5) - 2;
        room.participants = Math.max(5, room.participants + delta);
      });
    },
    setViewMode: (state, action: PayloadAction<'grid' | 'list' | 'compact'>) => {
      state.viewMode = action.payload;
    },
    setHabitsSubTab: (state, action: PayloadAction<'tasks' | 'micro'>) => {
      state.habitsSubTab = action.payload;
    },
  },
});

export const {
  addHabit,
  editHabit,
  hydrateHabits,
  toggleHabitCompletion,
  deleteHabit,
  setDailyFocus,
  toggleStruggle,
  completeOnboarding,
  resetOnboarding,
  addListeningTime,
  updateCoworkingRoomParticipants,
  setViewMode,
  setHabitsSubTab,
} = habitSlice.actions;

export default habitSlice.reducer;
