import React, { useState, useRef } from 'react';
import { Modal, ScrollView, TouchableOpacity, Dimensions, TextInput, TouchableWithoutFeedback, PanResponder, Text, Animated } from 'react-native';
import styled from 'styled-components/native';
import { Plus, Check, Trash2, Heart, Moon, Compass, Sparkles, X, Settings as SettingsIcon, BarChart2, Edit2, Calendar, Clock, Grid, List, Layers, Bell, Folder, ChevronLeft, ChevronRight, Wallet, Wind, Brain, Shield, DollarSign, Send, CupSoda, Coffee, Droplets, Cpu, BookOpen, Activity, Dumbbell, Star, Music } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../store';
import { addHabit, editHabit, toggleHabitCompletion, deleteHabit, setViewMode, setHabitsSubTab } from '../store/habitSlice';
import { HabitGrid } from '../components/HabitGrid';
import { GlassCard } from '../components/GlassCard';
import { theme } from '../theme/colors';
import Svg, { Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Available custom icons for picker
const ICONS_LIST = [
  'wallet', 'wind', 'moon', 'brain', 'instagram', 'shield', 'dollar', 'send', 'drink', 'cup',
  'droplets', 'cpu', 'heart', 'star', 'music', 'book', 'activity', 'dumbbell', 'clock', 'coffee'
];

// 18-color palette grid matching Image 3
const COLORS_PALETTE = [
  '#FF6B6B', '#FF8E53', '#FFB347', '#FFD043', '#A8E6CF', '#4ECDC4',
  '#38EF7D', '#00F2FE', '#33A3FF', '#4C6EF5', '#748FFC', '#9B7EDE',
  '#C4A8F5', '#FF7EB9', '#FF4F81', '#7B5FB5', '#90A4AE', '#D7CCC8'
];

const SUGGESTIONS_DATA = {
  'EASY WINS': [
    { name: 'Literally survive the day', description: 'Be kind to yourself', unit: 'Stay alive', icon: 'star', color: '#FFD043' },
    { name: 'Just be', description: 'Rest for a moment', unit: 'Breathe', icon: 'brain', color: '#9B7EDE' },
    { name: 'Drink hot water', description: 'Hydrate your body', unit: 'Drink 1 cup', icon: 'droplets', color: '#00F2FE' },
    { name: 'Change clothes', description: 'Refresh yourself', unit: 'Put on clean clothes', icon: 'activity', color: '#FF7EB9' },
    { name: 'Wash face', description: 'Splash cold water', unit: 'Wash face', icon: 'droplets', color: '#FF6B6B' },
  ],
  'MOVEMENT': [
    { name: 'Take a stretch break', description: 'Stretch your legs and back', unit: 'Stretch 1 min', icon: 'activity', color: '#38EF7D' },
    { name: 'Walk outside', description: 'Get some fresh air', unit: 'Walk 5 mins', icon: 'dumbbell', color: '#A8E6CF' },
    { name: 'Do 5 squats', description: 'Quick blood flow boost', unit: '5 squats', icon: 'dumbbell', color: '#FF8E53' },
  ],
  'CALM': [
    { name: 'Take 3 deep breaths', description: 'Inhale calm, exhale stress', unit: '3 breaths', icon: 'wind', color: '#38EF7D' },
    { name: 'Listen to a song', description: 'Listen to one track you love', unit: '1 song', icon: 'music', color: '#C4A8F5' },
    { name: 'Box breathing reset', description: 'ADHD breathwork', unit: '2 mins', icon: 'wind', color: '#4ECDC4' },
  ],
  'CONNECTION': [
    { name: 'Text a friend', description: 'Send a quick message', unit: 'Send 1 text', icon: 'send', color: '#33A3FF' },
    { name: 'Tell someone you care', description: 'Share positive energy', unit: 'Say thank you', icon: 'heart', color: '#FF4F81' },
    { name: 'Pet an animal', description: 'Ground yourself', unit: 'Pet animal', icon: 'heart', color: '#FFD043' },
  ]
};

interface HabitTrackerProps {
  onOpenSettings: () => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ onOpenSettings }) => {
  const dispatch = useAppDispatch();
  const habits = useAppSelector((state) => state.habits.habits);

  const viewMode = useAppSelector((state) => state.habits.viewMode);

  React.useEffect(() => {
    const loadSavedViewMode = async () => {
      try {
        const saved = await AsyncStorage.getItem('habits_view_mode');
        if (saved === 'grid' || saved === 'list' || saved === 'compact') {
          dispatch(setViewMode(saved));
        }
        const savedSub = await AsyncStorage.getItem('habits_sub_tab');
        if (savedSub === 'tasks' || savedSub === 'micro') {
          dispatch(setHabitsSubTab(savedSub));
        }
      } catch (e) {
        console.log('Error loading saved habits preferences', e);
      }
    };
    loadSavedViewMode();
  }, []);

  const activeModalCloseFn = () => {
    setShowDetailModal(false);
    setShowAddModal(false);
    setShowAnalyticsModal(false);
  };

  const modalSwipePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dy, dx } = gestureState;
        // Respond to downward swipes
        return dy > 45 && Math.abs(dx) < 30;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dy } = gestureState;
        if (dy > 90) {
          activeModalCloseFn();
        }
      },
    })
  ).current;

  // Modals visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // Form states (shared for Add and Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [smallestUnit, setSmallestUnit] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [selectedIcon, setSelectedIcon] = useState('brain');

  // Advanced options
  const [streakGoal, setStreakGoal] = useState('None');
  const [reminder, setReminder] = useState('None');
  const [category, setCategory] = useState('None');
  const [trackingType, setTrackingType] = useState<'step' | 'custom'>('step');
  const [completionsPerDay, setCompletionsPerDay] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const habitsSubTab = useAppSelector((state) => state.habits.habitsSubTab);
  const [showTaskPopupId, setShowTaskPopupId] = useState<string | null>(null);
  const [isTaskCreation, setIsTaskCreation] = useState(false);
  const [activeSuggestionCategory, setActiveSuggestionCategory] = useState('EASY WINS');
  const [confettiParticles, setConfettiParticles] = useState<any[]>([]);

  const isMicroHabit = (habit: any) => {
    return habit.isTask !== true;
  };

  const triggerConfettiAnimation = () => {
    const colors = ['#FF6B6B', '#FFB347', '#38EF7D', '#00F2FE', '#9B7EDE', '#FF7EB9'];
    const particleData = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: new Animated.Value(-30),
      rotate: `${Math.random() * 360}deg`,
      scale: Math.random() * 0.7 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setConfettiParticles(particleData);

    const anims = particleData.map(p => {
      return Animated.timing(p.y, {
        toValue: 900,
        duration: Math.random() * 1200 + 800,
        useNativeDriver: false,
      });
    });

    Animated.parallel(anims).start(() => {
      setConfettiParticles([]);
    });
  };

  const handleToggleCompletion = (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      const wasCompleted = habit.completions.includes(date);
      dispatch(toggleHabitCompletion({ habitId, date }));
      if (!wasCompleted) {
        triggerConfettiAnimation();
      }
    }
  };

  // Month navigation for Interactive Calendar Detail (Image 2)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // July (0-indexed, so 6)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getTodayLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayLocalDateStr();

  const activeHabit = habits.find(h => h.id === selectedHabitId) || null;

  const getGoalTypeText = (habit: any) => {
    if (habit.streakGoal && habit.streakGoal !== 'None') {
      return habit.streakGoal;
    }
    if (habit.completionsPerDay > 1) {
      return `${habit.completionsPerDay}/day`;
    }
    return 'Daily';
  };

  // Generate the last 5 days list (Image 2 style)
  const getRecent5Days = () => {
    const result = [];
    const daysLabel = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        dateStr,
        dayName: daysLabel[d.getDay()],
        dayNum: d.getDate(),
      });
    }
    return result;
  };
  const recent5Days = getRecent5Days();

  // Trailing 12 months completion history generator (Image 5 style)
  const getBacklogHistory = () => {
    const items: any[] = [];
    const now = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(now.getMonth() - 12);

    habits.forEach((habit) => {
      const sortedComps = [...habit.completions].sort();

      sortedComps.forEach((dateStr) => {
        const compDate = new Date(dateStr);
        if (compDate < twelveMonthsAgo) return;

        const idx = sortedComps.indexOf(dateStr);
        let streak = 0;
        if (idx >= 0) {
          streak = 1;
          let checkDate = new Date(dateStr);
          for (let j = idx - 1; j >= 0; j--) {
            checkDate.setDate(checkDate.getDate() - 1);
            const checkDateStr = checkDate.toISOString().split('T')[0];
            if (sortedComps[j] === checkDateStr) {
              streak += 1;
            } else {
              break;
            }
          }
        }

        let text = 'Task Completed';
        if (dateStr === habit.createdDate) {
          text = 'Task Started';
        } else if (streak === 1) {
          text = 'Unlocked 1 day streak';
        } else if (streak > 1) {
          text = `${streak} day ongoing streak`;
        }

        items.push({
          habitId: habit.id,
          name: habit.name,
          color: habit.color,
          icon: habit.icon,
          dateStr,
          timestamp: compDate.getTime(),
          text,
        });
      });

      if (!habit.completions.includes(habit.createdDate)) {
        const createdDateObj = new Date(habit.createdDate);
        if (createdDateObj >= twelveMonthsAgo) {
          items.push({
            habitId: habit.id,
            name: habit.name,
            color: habit.color,
            icon: habit.icon,
            dateStr: habit.createdDate,
            timestamp: createdDateObj.getTime(),
            text: 'Task Started',
          });
        }
      }
    });

    items.sort((a, b) => b.timestamp - a.timestamp);
    return items;
  };

  const groupedHistory = () => {
    const list = getBacklogHistory();
    const groups: { [key: string]: any[] } = {};

    list.forEach(item => {
      const d = new Date(item.dateStr);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return Object.keys(groups).map(key => ({
      month: key,
      data: groups[key],
    }));
  };

  const renderMiniCalendarGrid = (habit: any) => {
    const tiles = [];
    const today = new Date();

    // Render the last 15 days in order (oldest to newest)
    for (let i = 14; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const isCompleted = habit.completions.includes(dateStr);

      tiles.push(
        <MiniTile
          key={dateStr}
          completed={isCompleted}
          isValid={true}
          activeColor={habit.color}
        />
      );
    }
    return <MiniGrid>{tiles}</MiniGrid>;
  };

  // Icon mapping helper
  const getIconElement = (name: string, color: string = '#FFFFFF', size: number = 18) => {
    switch (name) {
      case 'wallet': return <Wallet color={color} size={size} />;
      case 'wind': return <Wind color={color} size={size} />;
      case 'moon': return <Moon color={color} size={size} />;
      case 'brain': return <Brain color={color} size={size} />;
      case 'instagram': return <Sparkles color={color} size={size} />;
      case 'shield': return <Shield color={color} size={size} />;
      case 'dollar': return <DollarSign color={color} size={size} />;
      case 'send': return <Send color={color} size={size} />;
      case 'drink': return <CupSoda color={color} size={size} />;
      case 'cup': return <Coffee color={color} size={size} />;
      case 'droplets': return <Droplets color={color} size={size} />;
      case 'cpu': return <Cpu color={color} size={size} />;
      case 'heart': return <Heart color={color} size={size} />;
      case 'star': return <Star color={color} size={size} />;
      case 'music': return <Music color={color} size={size} />;
      case 'book': return <BookOpen color={color} size={size} />;
      case 'activity': return <Activity color={color} size={size} />;
      case 'dumbbell': return <Dumbbell color={color} size={size} />;
      case 'clock': return <Clock color={color} size={size} />;
      case 'coffee': return <Coffee color={color} size={size} />;
      default: return <Sparkles color={color} size={size} />;
    }
  };

  // Trigger Creator/Editor Modal
  const openCreator = () => {
    setIsEditing(false);
    setHabitName('');
    setHabitDesc('');
    setSmallestUnit(habitsSubTab === 'tasks' ? 'Complete task' : 'Write 1 sentence');
    setSelectedColor('#FF6B6B');
    setSelectedIcon('brain');
    setStreakGoal('None');
    setReminder('None');
    setCategory(habitsSubTab === 'tasks' ? 'Task' : 'None');
    setTrackingType('step');
    setCompletionsPerDay(1);
    setShowAdvanced(false);
    setIsTaskCreation(habitsSubTab === 'tasks');
    setShowAddModal(true);
  };

  const openEditor = (habit: any) => {
    setIsEditing(true);
    setHabitName(habit.name);
    setHabitDesc(habit.description || '');
    setSmallestUnit(habit.smallestUnit);
    setSelectedColor(habit.color);
    setSelectedIcon(habit.icon);
    setStreakGoal(habit.streakGoal || 'None');
    setReminder(habit.reminder || 'None');
    setCategory(habit.category || 'None');
    setTrackingType(habit.trackingType || 'step');
    setCompletionsPerDay(habit.completionsPerDay || 1);
    setShowAdvanced(false);
    setIsTaskCreation(habit.isTask === true);
    setShowAddModal(true);
  };

  const handleSaveHabit = () => {
    if (!habitName.trim()) return;

    const habitData = {
      name: habitName,
      smallestUnit: smallestUnit || '1 minute task',
      description: habitDesc,
      color: selectedColor,
      icon: selectedIcon,
      streakGoal,
      reminder,
      category,
      trackingType,
      completionsPerDay,
      isTask: isTaskCreation,
    };

    if (isEditing && selectedHabitId) {
      dispatch(editHabit({ id: selectedHabitId, ...habitData }));
    } else {
      dispatch(addHabit(habitData));
    }
    setShowAddModal(false);
  };

  // Interactive Monthly Grid Builders (Image 2)
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayIndex = (year: number, month: number) => {
    // 0 = Sunday, 1 = Monday...
    let day = new Date(year, month, 1).getDay();
    // Shift so Monday is 0, Sunday is 6
    return day === 0 ? 6 : day - 1;
  };

  const renderCalendarDays = () => {
    if (!activeHabit) return null;
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const startOffset = getFirstDayIndex(currentYear, currentMonth);
    const totalSlots = Math.ceil((daysInMonth + startOffset) / 7) * 7;

    const days = [];
    const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    for (let i = 0; i < totalSlots; i++) {
      const dayNum = i - startOffset + 1;
      const isValidDay = dayNum > 0 && dayNum <= daysInMonth;

      // Construct ISO date string YYYY-MM-DD
      const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
      const isCompleted = isValidDay && activeHabit.completions.includes(dateStr);
      const isCurrentDay = isValidDay && todayStr === dateStr;

      days.push(
        <DayCell key={i} activeOpacity={0.7} disabled={!isValidDay} onPress={() => {
          if (isValidDay) {
            handleToggleCompletion(activeHabit.id, dateStr);
          }
        }}>
          {isValidDay && (
            <DayLabelContainer completed={isCompleted} color={activeHabit.color} isToday={isCurrentDay}>
              <DayNumberText completed={isCompleted} isToday={isCurrentDay}>
                {dayNum}
              </DayNumberText>
              {isCompleted && <UnderDot />}
            </DayLabelContainer>
          )}
        </DayCell>
      );
    }

    return (
      <CalendarGrid>
        <WeekdayRow>
          {weekdays.map((w, idx) => (
            <WeekdayLabel key={idx}>{w}</WeekdayLabel>
          ))}
        </WeekdayRow>
        <DaysGridRow>{days}</DaysGridRow>
      </CalendarGrid>
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const toggleViewMode = () => {
    const nextMode = viewMode === 'grid' ? 'list' : viewMode === 'list' ? 'compact' : 'grid';
    dispatch(setViewMode(nextMode));
    AsyncStorage.setItem('habits_view_mode', nextMode).catch(e => console.log('Error saving viewMode', e));
  };

  return (
    <Container>
      {/* Habits Central Header Area (Image 1) */}
      <HeaderBar>
        <HeaderLeftActions>
          <SettingsButton onPress={onOpenSettings}>
            <SettingsIcon size={18} color="#FFFFFF" />
          </SettingsButton>
          {habitsSubTab === 'micro' && (
            <LayoutButton onPress={toggleViewMode}>
              {viewMode === 'grid' ? (
                <Grid size={18} color="#FFFFFF" />
              ) : viewMode === 'list' ? (
                <List size={18} color="#FFFFFF" />
              ) : (
                <Layers size={18} color="#FFFFFF" />
              )}
            </LayoutButton>
          )}
        </HeaderLeftActions>

        <LogoTextArea>
          <HeaderTitle>Micro Habits & Goals</HeaderTitle>
          <ProBadge>
            <ProBadgeText>PRO</ProBadgeText>
          </ProBadge>
        </LogoTextArea>

        <RightActions>
          <ActionButton onPress={() => setShowAnalyticsModal(true)}>
            <BarChart2 size={18} color="#FFFFFF" />
          </ActionButton>
          <AddCircleButton onPress={openCreator}>
            <Plus size={18} color="#08080A" strokeWidth={3} />
          </AddCircleButton>
        </RightActions>
      </HeaderBar>

      <ScrollContent showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Today's Progress Report Card (Image 1) */}
        {(() => {
          const completedTodayCount = habits.filter(h => h.completions.includes(todayStr)).length;
          const totalCount = habits.length;
          const percent = totalCount > 0 ? Math.round((completedTodayCount / totalCount) * 100) : 0;
          const radius = 22;
          const strokeWidth = 5;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (percent / 100) * circumference;

          const completedTasks = habits.filter(h => !isMicroHabit(h) && h.completions.includes(todayStr)).length;
          const totalTasks = habits.filter(h => !isMicroHabit(h)).length;
          const completedMicro = habits.filter(h => isMicroHabit(h) && h.completions.includes(todayStr)).length;
          const totalMicro = habits.filter(h => isMicroHabit(h)).length;

          let feedbackText = 'Keep building momentum!';
          if (percent === 100) feedbackText = 'Amazing! All completed! 🎉';
          else if (percent >= 75) feedbackText = 'Almost there! Keep going! 💪';
          else if (percent >= 50) feedbackText = 'Great progress! 👍';
          else if (percent >= 25) feedbackText = 'Off to a good start!';

          return (
            <ProgressCard onPress={() => setShowAnalyticsModal(true)} activeOpacity={0.85}>
              <ProgressInfo>
                <ProgressTitle>Today's Progress</ProgressTitle>
                <ProgressCount>{completedTodayCount} of {totalCount} Completed</ProgressCount>
                <ProgressFeedback>{feedbackText} (tasks {completedTasks}/{totalTasks}, micro habits {completedMicro}/{totalMicro})</ProgressFeedback>
              </ProgressInfo>
              <ProgressRingContainer>
                <Svg width={60} height={60} viewBox="0 0 60 60">
                  <Circle
                    cx={30}
                    cy={30}
                    r={radius}
                    stroke="#1E1E26"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <Circle
                    cx={30}
                    cy={30}
                    r={radius}
                    stroke="#FF7E47"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 30 30)"
                  />
                </Svg>
                <ProgressPercentText>{percent}%</ProgressPercentText>
              </ProgressRingContainer>
            </ProgressCard>
          );
        })()}

        {/* VIEW MODE: GRID (Image 1 style) */}
        {habitsSubTab === 'micro' && viewMode === 'grid' && habits.filter(isMicroHabit).map((habit) => {
          const isCompletedToday = habit.completions.includes(todayStr);
          return (
            <HabitKitCard key={habit.id} activeOpacity={0.95} onPress={() => {
              setSelectedHabitId(habit.id);
              setShowDetailModal(true);
            }}>
              <CardMainRow>
                <CardIconBox color={habit.color}>
                  {getIconElement(habit.icon, '#FFFFFF', 18)}
                </CardIconBox>

                <CardTextColumn>
                  <HabitTitle>{habit.name}</HabitTitle>
                  <HabitDescription numberOfLines={1}>
                    {habit.description || habit.smallestUnit}
                  </HabitDescription>
                </CardTextColumn>

                {/* Right checkbox action */}
                <CardCheckbox
                  completed={isCompletedToday}
                  color={habit.color}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleCompletion(habit.id, todayStr);
                  }}
                >
                  {isCompletedToday && <Check size={14} color="#08080A" strokeWidth={3} />}
                </CardCheckbox>
              </CardMainRow>

              {/* Compressed inline HabitKit calendar grid */}
              <CardGridWrapper pointerEvents="none">
                <HabitGrid completions={habit.completions} color={habit.color} />
              </CardGridWrapper>

              <CompleteLongButton
                completed={isCompletedToday}
                color={habit.color}
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleCompletion(habit.id, todayStr);
                }}
              >
                {isCompletedToday ? (
                  <>
                    <Check size={13} color="#6B6280" strokeWidth={3} />
                    <CompleteLongButtonText completed={true}>Completed Today</CompleteLongButtonText>
                  </>
                ) : (
                  <>
                    <Check size={13} color="#08080A" strokeWidth={3} />
                    <CompleteLongButtonText completed={false}>Complete</CompleteLongButtonText>
                  </>
                )}
              </CompleteLongButton>

              <CardFooterStreak color={habit.color} style={{ marginTop: 8 }}>
                🔥 Current Streak: {habit.streakCount} days (Max: {habit.maxStreak})
              </CardFooterStreak>
            </HabitKitCard>
          );
        })}

        {/* VIEW MODE: LIST (Image 2 style) */}
        {habitsSubTab === 'micro' && viewMode === 'list' && habits.filter(isMicroHabit).length > 0 && (
          <RecentDaysHeader>
            <RecentDaysPill>
              <RecentDaysPillText>Last 5 days</RecentDaysPillText>
            </RecentDaysPill>
            <RecentDaysCols>
              {recent5Days.map((day, idx) => (
                <RecentDayHeaderCol key={idx}>
                  <RecentDayHeaderName>{day.dayName}</RecentDayHeaderName>
                  <RecentDayHeaderNum>{day.dayNum}</RecentDayHeaderNum>
                </RecentDayHeaderCol>
              ))}
            </RecentDaysCols>
          </RecentDaysHeader>
        )}

        {habitsSubTab === 'micro' && viewMode === 'list' && habits.filter(isMicroHabit).map((habit) => {
          return (
            <ListRow key={habit.id} activeOpacity={0.95} onPress={() => {
              setSelectedHabitId(habit.id);
              setShowDetailModal(true);
            }}>
              <ListTitleBlock color={habit.color}>
                <ListIconBox color={habit.color}>
                  {getIconElement(habit.icon, '#FFFFFF', 14)}
                </ListIconBox>
                <ListTitleColumn>
                  <ListTitle numberOfLines={1}>{habit.name}</ListTitle>
                  <ListMetadataRow>
                    <ListMetadataText>{getGoalTypeText(habit)}</ListMetadataText>
                    <ListMetadataSpacing />
                    <ListStreakText>🔥 {habit.streakCount}</ListStreakText>
                  </ListMetadataRow>
                </ListTitleColumn>
              </ListTitleBlock>

              <ListCheckboxes>
                {recent5Days.map((day) => {
                  const isCompleted = habit.completions.includes(day.dateStr);
                  return (
                    <ListCheckboxCell
                      key={day.dateStr}
                      completed={isCompleted}
                      color={habit.color}
                      onPress={() => {
                        handleToggleCompletion(habit.id, day.dateStr);
                      }}
                    >
                      {isCompleted && <Check size={12} color="#08080A" strokeWidth={3} />}
                    </ListCheckboxCell>
                  );
                })}
              </ListCheckboxes>
            </ListRow>
          );
        })}

        {/* VIEW MODE: COMPACT (Image 3 style) */}
        {habitsSubTab === 'micro' && viewMode === 'compact' && habits.filter(isMicroHabit).length > 0 && (
          <CompactGridContainer>
            {habits.filter(isMicroHabit).map((habit) => {
              const isCompletedToday = habit.completions.includes(todayStr);
              return (
                <CompactCard key={habit.id} activeOpacity={0.95} onPress={() => {
                  setSelectedHabitId(habit.id);
                  setShowDetailModal(true);
                }}>
                  <CompactCardHeader>
                    <CompactCardCheckbox
                      completed={isCompletedToday}
                      color={habit.color}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleCompletion(habit.id, todayStr);
                      }}
                    >
                      {isCompletedToday && <Check size={10} color="#08080A" strokeWidth={3} />}
                    </CompactCardCheckbox>
                    <CompactCardTitleCol>
                      <CompactCardTitle numberOfLines={1}>{habit.name}</CompactCardTitle>
                      <CompactCardSub>{monthNames[currentMonth].substring(0, 3)} {currentYear}</CompactCardSub>
                    </CompactCardTitleCol>
                  </CompactCardHeader>

                  {renderMiniCalendarGrid(habit)}

                  <CompactCompleteButton
                    completed={isCompletedToday}
                    color={habit.color}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleCompletion(habit.id, todayStr);
                    }}
                  >
                    {isCompletedToday ? (
                      <>
                        <Check size={11} color="#6B6280" strokeWidth={3} />
                        <CompactCompleteButtonText completed={true}>Completed</CompactCompleteButtonText>
                      </>
                    ) : (
                      <>
                        <Check size={11} color="#08080A" strokeWidth={3} />
                        <CompactCompleteButtonText completed={false}>Complete</CompactCompleteButtonText>
                      </>
                    )}
                  </CompactCompleteButton>
                </CompactCard>
              );
            })}
          </CompactGridContainer>
        )}

        {/* NEW TASKS SUB TAB */}
        {habitsSubTab === 'tasks' && (
          <TasksContainer>
            {habits.filter(h => !isMicroHabit(h)).map((task) => {
              const isCompletedToday = task.completions.includes(todayStr);
              return (
                <TaskRowCard key={task.id} activeOpacity={0.9} onPress={() => setShowTaskPopupId(task.id)}>
                  <TaskRowLeft>
                    <TaskTextColumn style={{ marginLeft: 0 }}>
                      <TaskTitle completed={isCompletedToday}>{task.name}</TaskTitle>
                      <TaskSub>{task.smallestUnit}</TaskSub>
                    </TaskTextColumn>
                  </TaskRowLeft>
                  
                  <TaskRowRight style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TaskStreakText style={{ marginRight: 12 }}>🔥 {task.streakCount}d</TaskStreakText>
                    <TaskCheckboxCircle
                      completed={isCompletedToday}
                      color={task.color}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleCompletion(task.id, todayStr);
                      }}
                    >
                      {isCompletedToday && <Check size={14} color="#08080A" strokeWidth={3} />}
                    </TaskCheckboxCircle>
                  </TaskRowRight>
                </TaskRowCard>
              );
            })}
          </TasksContainer>
        )}

        {habitsSubTab === 'micro' && habits.filter(isMicroHabit).length === 0 && (
          <EmptyStateContainer>
            <Sparkles size={40} color="#6B6280" style={{ marginBottom: 12 }} />
            <EmptyStateText>No habits in your garden.</EmptyStateText>
            <EmptyStateSubtext>Add a nano-habit to start building consistency.</EmptyStateSubtext>
          </EmptyStateContainer>
        )}

        {habitsSubTab === 'tasks' && habits.filter(h => !isMicroHabit(h)).length === 0 && (
          <EmptyStateContainer>
            <Sparkles size={40} color="#6B6280" style={{ marginBottom: 12 }} />
            <EmptyStateText>No tasks today.</EmptyStateText>
            <EmptyStateSubtext>Your task list is completely clear!</EmptyStateSubtext>
          </EmptyStateContainer>
        )}

        <ExtraSpacing />
      </ScrollContent>

      {/* Sub Tab Navigation overlay above bottom tab menu */}
      <SubTabBarContainer>
        <SubTabButton active={habitsSubTab === 'tasks'} onPress={() => {
          dispatch(setHabitsSubTab('tasks'));
          AsyncStorage.setItem('habits_sub_tab', 'tasks').catch(e => console.log(e));
        }}>
          <SubTabButtonText active={habitsSubTab === 'tasks'}>Tasks & Goals</SubTabButtonText>
        </SubTabButton>
        <SubTabSpacer />
        <SubTabButton active={habitsSubTab === 'micro'} onPress={() => {
          dispatch(setHabitsSubTab('micro'));
          AsyncStorage.setItem('habits_sub_tab', 'micro').catch(e => console.log(e));
        }}>
          <SubTabButtonText active={habitsSubTab === 'micro'}>Micro Habits</SubTabButtonText>
        </SubTabButton>
      </SubTabBarContainer>

      {/* 4. Finch-style Non-edge Task Popup Overlay (Image 5) */}
      {showTaskPopupId && (() => {
        const task = habits.find(h => h.id === showTaskPopupId);
        if (!task) return null;
        const isCompletedToday = task.completions.includes(todayStr);
        return (
          <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setShowTaskPopupId(null)}>
            <PopupModalBackdrop activeOpacity={1} onPress={() => setShowTaskPopupId(null)}>
              <TouchableWithoutFeedback>
                <PopupCenterWrapper>
                  <PopupCardContainer activeOpacity={0.95} onPress={() => {
                    setShowTaskPopupId(null);
                    setSelectedHabitId(task.id);
                    setShowDetailModal(true);
                  }}>
                    {/* Top right spark count */}
                    <PopupSparkBadge>
                      <Text style={{ color: '#FFB347', fontSize: 11, fontWeight: 'bold' }}>5 ⚡</Text>
                    </PopupSparkBadge>

                    {/* Center Icon & Title */}
                    <PopupContentCenter>
                      <PopupCircleIcon color={task.color}>
                        {getIconElement(task.icon, '#FFFFFF', 28)}
                      </PopupCircleIcon>
                      <PopupTaskTitle>{task.name}</PopupTaskTitle>
                      <PopupFrequencyText>🔁 daily</PopupFrequencyText>
                    </PopupContentCenter>

                    {/* Bottom Action row */}
                    <PopupActionRow>
                      <PopupButton onPress={() => setShowTaskPopupId(null)}>
                        <PopupActionIconWrapper>
                          <Wind size={16} color="#00F2FE" />
                        </PopupActionIconWrapper>
                        <PopupButtonText>Skip</PopupButtonText>
                      </PopupButton>

                      <PopupCompleteCircleButton completed={isCompletedToday} onPress={() => {
                        handleToggleCompletion(task.id, todayStr);
                        setShowTaskPopupId(null);
                      }}>
                        <Check size={20} color={isCompletedToday ? '#6B6280' : '#08080A'} strokeWidth={3} />
                        <PopupCompleteText completed={isCompletedToday}>
                          {isCompletedToday ? 'Completed' : 'Complete'}
                        </PopupCompleteText>
                      </PopupCompleteCircleButton>

                      <PopupButton onPress={() => setShowTaskPopupId(null)}>
                        <PopupActionIconWrapper>
                          <Calendar size={16} color="#FF6B9D" />
                        </PopupActionIconWrapper>
                        <PopupButtonText>Snooze</PopupButtonText>
                      </PopupButton>
                    </PopupActionRow>
                  </PopupCardContainer>

                  {/* Under-card Close button */}
                  <PopupCloseCircle onPress={() => setShowTaskPopupId(null)}>
                    <X size={20} color="#FFFFFF" />
                  </PopupCloseCircle>
                </PopupCenterWrapper>
              </TouchableWithoutFeedback>
            </PopupModalBackdrop>
          </Modal>
        );
      })()}



      {/* 1. Habit Detail Bottom-up Modal (Image 2) */}
      {activeHabit && (
        <Modal visible={showDetailModal} transparent={true} animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
          <ModalBackdrop activeOpacity={1} onPress={() => setShowDetailModal(false)}>
            <TouchableWithoutFeedback>
              <DetailContainer>
                <HeaderWrapper {...modalSwipePanResponder.panHandlers}>
                  <GestureIndicatorContainer>
                    <GestureIndicatorBar />
                  </GestureIndicatorContainer>
                  {/* Modal Header */}
                  <DetailHeader>
                    <DetailHeaderLeft>
                      <CardIconBox color={activeHabit.color}>
                        {getIconElement(activeHabit.icon, '#FFFFFF', 20)}
                      </CardIconBox>
                      <DetailTextInfo>
                        <DetailTitle>{activeHabit.name}</DetailTitle>
                        <DetailDescText>{activeHabit.description || 'ADHD Nano Habit'}</DetailDescText>
                      </DetailTextInfo>
                    </DetailHeaderLeft>
                    <CloseButton onPress={() => setShowDetailModal(false)}>
                      <X size={20} color="#FFFFFF" />
                    </CloseButton>
                  </DetailHeader>
                </HeaderWrapper>

                {/* Compressed full grid preview */}
                <DetailInlineGridWrapper>
                  <HabitGrid completions={activeHabit.completions} color={activeHabit.color} />
                </DetailInlineGridWrapper>

                {/* Stats and Edit buttons row */}
                <DetailActionRow>
                  <InfoPill>
                    <InfoPillText>Goal: {activeHabit.streakGoal === 'None' ? 'No Streak Goal' : activeHabit.streakGoal}</InfoPillText>
                  </InfoPill>
                  <InfoPill>
                    <InfoPillText>🔥 Streak: {activeHabit.streakCount}d</InfoPillText>
                  </InfoPill>

                  <RightActionsGroup>
                    <SquareButton onPress={() => {
                      setShowDetailModal(false);
                      openEditor(activeHabit);
                    }}>
                      <Edit2 size={16} color="#FFFFFF" />
                    </SquareButton>
                    <SquareButton onPress={() => {
                      dispatch(deleteHabit(activeHabit.id));
                      setShowDetailModal(false);
                    }}>
                      <Trash2 size={16} color="#FF6B6B" />
                    </SquareButton>
                  </RightActionsGroup>
                </DetailActionRow>

                {/* Interactive Calendar Title & Switcher */}
                <MonthSelectorRow>
                  <MonthSelectorTitle>{monthNames[currentMonth]} {currentYear}</MonthSelectorTitle>
                  <MonthNavigators>
                    <MonthNavButton onPress={() => navigateMonth('prev')}>
                      <ChevronLeft size={18} color="#FFFFFF" />
                    </MonthNavButton>
                    <MonthNavButton onPress={() => navigateMonth('next')}>
                      <ChevronRight size={18} color="#FFFFFF" />
                    </MonthNavButton>
                  </MonthNavigators>
                </MonthSelectorRow>

                {/* Interactive Monthly Grid Display */}
                {renderCalendarDays()}

                <DetailExtraSpacing />
              </DetailContainer>
            </TouchableWithoutFeedback>
          </ModalBackdrop>
        </Modal>
      )}

      {/* 2. Habit Creator & Editor Modal (Image 3 & 4) */}
      <Modal visible={showAddModal} transparent={true} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <ModalBackdrop activeOpacity={1} onPress={() => setShowAddModal(false)}>
          <TouchableWithoutFeedback>
            <EditorContainer>
              <HeaderWrapper {...modalSwipePanResponder.panHandlers}>
                <GestureIndicatorContainer>
                  <GestureIndicatorBar />
                </GestureIndicatorContainer>
                <EditorHeader>
                  <CloseButton onPress={() => setShowAddModal(false)}>
                    <X size={20} color="#FFFFFF" />
                  </CloseButton>
                  <EditorHeaderTitle>{isEditing ? 'Edit Habit' : 'New Habit'}</EditorHeaderTitle>
                  <PlaceholderButton />
                </EditorHeader>
              </HeaderWrapper>

              <EditorScrollContent showsVerticalScrollIndicator={false}>

                {isTaskCreation && (
                  <SuggestionsBox>
                    <SuggestionsTitle>Suggestions</SuggestionsTitle>
                    {SUGGESTIONS_DATA[activeSuggestionCategory as keyof typeof SUGGESTIONS_DATA].map((sug, idx) => (
                      <SuggestionRow key={idx} onPress={() => {
                        setHabitName(sug.name);
                        setHabitDesc(sug.description);
                        setSmallestUnit(sug.unit);
                        setSelectedIcon(sug.icon);
                        setSelectedColor(sug.color);
                      }}>
                        <SuggestionLeft>
                          <SuggestionIconBox color={sug.color}>
                            {getIconElement(sug.icon, '#FFFFFF', 14)}
                          </SuggestionIconBox>
                          <SuggestionName>{sug.name}</SuggestionName>
                        </SuggestionLeft>
                        <Plus size={14} color="#FF7E47" strokeWidth={3} />
                      </SuggestionRow>
                    ))}

                    <SuggestionCategoryCarousel horizontal showsHorizontalScrollIndicator={false}>
                      {Object.keys(SUGGESTIONS_DATA).map((cat) => (
                        <SuggestionCategoryTab
                          key={cat}
                          active={activeSuggestionCategory === cat}
                          onPress={() => setActiveSuggestionCategory(cat)}
                        >
                          <SuggestionCategoryTabText active={activeSuggestionCategory === cat}>
                            {cat}
                          </SuggestionCategoryTabText>
                        </SuggestionCategoryTab>
                      ))}
                    </SuggestionCategoryCarousel>
                  </SuggestionsBox>
                )}

                {/* Circular Preview Icon */}
                <PreviewIconContainer>
                  <PreviewCircle color={selectedColor}>
                    {getIconElement(selectedIcon, '#FFFFFF', 32)}
                  </PreviewCircle>
                </PreviewIconContainer>

                {/* Horizontal Scrollable Icon Selection Grid */}
                <IconSelectorCarousel horizontal showsHorizontalScrollIndicator={false}>
                  {ICONS_LIST.map((ic) => (
                    <IconOptionCell key={ic} selected={selectedIcon === ic} onPress={() => setSelectedIcon(ic)}>
                      {getIconElement(ic, selectedIcon === ic ? '#FF7E47' : '#6B6280', 20)}
                    </IconOptionCell>
                  ))}
                </IconSelectorCarousel>

                {/* Inputs */}
                <InputLabel>Name</InputLabel>
                <TextInputBox
                  value={habitName}
                  onChangeText={setHabitName}
                  placeholder="e.g. Drink Water"
                  placeholderTextColor="#6B6280"
                />

                <InputLabel>Description</InputLabel>
                <TextInputBox
                  value={habitDesc}
                  onChangeText={setHabitDesc}
                  placeholder="e.g. Keep body hydrated"
                  placeholderTextColor="#6B6280"
                />

                <InputLabel>ADHD Smallest Unit goal</InputLabel>
                <TextInputBox
                  value={smallestUnit}
                  onChangeText={setSmallestUnit}
                  placeholder="e.g. Drink 1 glass"
                  placeholderTextColor="#6B6280"
                />

                {/* Colors Grid (Image 3) */}
                <InputLabel>Color</InputLabel>
                <ColorsGridContainer>
                  {COLORS_PALETTE.map((col) => (
                    <ColorCircle key={col} color={col} onPress={() => setSelectedColor(col)}>
                      {selectedColor === col && <ColorDotCenter />}
                    </ColorCircle>
                  ))}
                </ColorsGridContainer>

                {/* Advanced Settings Toggle */}
                <AdvancedToggle onPress={() => setShowAdvanced(!showAdvanced)}>
                  <AdvancedToggleText>Advanced Options</AdvancedToggleText>
                  <ChevronRight size={14} color="#6B6280" style={{ transform: [{ rotate: showAdvanced ? '90deg' : '0deg' }] }} />
                </AdvancedToggle>

                {showAdvanced && (
                  <AdvancedFieldsArea>
                    <AdvancedFieldRow>
                      <AdvancedLabel>Streak Goal</AdvancedLabel>
                      <AdvancedSelectPill onPress={() => setStreakGoal(streakGoal === 'None' ? '5 days' : streakGoal === '5 days' ? '30 days' : 'None')}>
                        <AdvancedSelectText>{streakGoal}</AdvancedSelectText>
                      </AdvancedSelectPill>
                    </AdvancedFieldRow>

                    <AdvancedFieldRow>
                      <AdvancedLabel>Reminder</AdvancedLabel>
                      <AdvancedSelectPill onPress={() => setReminder(reminder === 'None' ? '08:00 AM' : 'None')}>
                        <AdvancedSelectText>{reminder}</AdvancedSelectText>
                      </AdvancedSelectPill>
                    </AdvancedFieldRow>

                    <AdvancedFieldRow>
                      <AdvancedLabel>Category</AdvancedLabel>
                      <AdvancedSelectPill onPress={() => setCategory(category === 'None' ? 'Health' : category === 'Health' ? 'Mind' : 'None')}>
                        <AdvancedSelectText>{category}</AdvancedSelectText>
                      </AdvancedSelectPill>
                    </AdvancedFieldRow>
                  </AdvancedFieldsArea>
                )}

                {/* Completion Tracking Mode Selector */}
                <InputLabel>How should completions be tracked?</InputLabel>
                <TrackingModeRow>
                  <TrackingModeTab active={trackingType === 'step'} onPress={() => setTrackingType('step')}>
                    <TrackingModeText active={trackingType === 'step'}>Step By Step</TrackingModeText>
                    <TrackingModeSub>Increment by 1 with each completion</TrackingModeSub>
                  </TrackingModeTab>
                  <TrackingModeTab active={trackingType === 'custom'} onPress={() => setTrackingType('custom')}>
                    <TrackingModeText active={trackingType === 'custom'}>Custom Value</TrackingModeText>
                    <TrackingModeSub>Enter custom number per completion</TrackingModeSub>
                  </TrackingModeTab>
                </TrackingModeRow>

                {/* Completions Per Day Stepper (Image 4) */}
                <InputLabel>Completions Per Day</InputLabel>
                <StepperRow>
                  <StepperLabelText>{completionsPerDay} / Day</StepperLabelText>
                  <StepperActions>
                    <StepperButton onPress={() => setCompletionsPerDay(Math.max(1, completionsPerDay - 1))}>
                      <StepperButtonText>-</StepperButtonText>
                    </StepperButton>
                    <StepperButton onPress={() => setCompletionsPerDay(completionsPerDay + 1)}>
                      <StepperButtonText>+</StepperButtonText>
                    </StepperButton>
                  </StepperActions>
                </StepperRow>

                {/* Save Button */}
                <SaveButton onPress={handleSaveHabit}>
                  <SaveButtonText>Save</SaveButtonText>
                </SaveButton>

                <EditorExtraSpacing />
              </EditorScrollContent>
            </EditorContainer>
          </TouchableWithoutFeedback>
        </ModalBackdrop>
      </Modal>

      {/* 3. Analytics / History Timeline Modal (Image 5) */}
      <Modal visible={showAnalyticsModal} transparent={true} animationType="slide" onRequestClose={() => setShowAnalyticsModal(false)}>
        <ModalBackdrop activeOpacity={1} onPress={() => setShowAnalyticsModal(false)}>
          <TouchableWithoutFeedback>
            <AnalyticsContainer>
              <HeaderWrapper {...modalSwipePanResponder.panHandlers}>
                <GestureIndicatorContainer>
                  <GestureIndicatorBar />
                </GestureIndicatorContainer>
                <AnalyticsHeader>
                  <AnalyticsHeaderLeft>
                    <AnalyticsHeaderTitle>Today, {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</AnalyticsHeaderTitle>
                  </AnalyticsHeaderLeft>
                  <AnalyticsHeaderRight>
                    {(() => {
                      const completedTodayCount = habits.filter(h => h.completions.includes(todayStr)).length;
                      const totalCount = habits.length;
                      const percent = totalCount > 0 ? Math.round((completedTodayCount / totalCount) * 100) : 0;
                      return <AnalyticsHeaderPercent>⚡️ {percent}%</AnalyticsHeaderPercent>;
                    })()}
                    <CloseButton onPress={() => setShowAnalyticsModal(false)}>
                      <X size={20} color="#FFFFFF" />
                    </CloseButton>
                  </AnalyticsHeaderRight>
                </AnalyticsHeader>
              </HeaderWrapper>

              <AnalyticsScrollContent showsVerticalScrollIndicator={false}>
                {(() => {
                  const completedTasks = habits.filter(h => !isMicroHabit(h) && h.completions.includes(todayStr)).length;
                  const totalTasks = habits.filter(h => !isMicroHabit(h)).length;
                  const completedMicro = habits.filter(h => isMicroHabit(h) && h.completions.includes(todayStr)).length;
                  const totalMicro = habits.filter(h => isMicroHabit(h)).length;

                  return (
                    <>
                      {/* Stats Cards Row */}
                      <StatsCardRowGrid>
                        <StatsMiniCard>
                          <StatsMiniCardTitle>Tasks Completed</StatsMiniCardTitle>
                          <StatsMiniCardNumber>🎯 {completedTasks} / {totalTasks}</StatsMiniCardNumber>
                        </StatsMiniCard>
                        <StatsMiniCard>
                          <StatsMiniCardTitle>Habits Completed</StatsMiniCardTitle>
                          <StatsMiniCardNumber>🌱 {completedMicro} / {totalMicro}</StatsMiniCardNumber>
                        </StatsMiniCard>
                      </StatsCardRowGrid>

                      {/* Category progress breakdown */}
                      <StatsCategorySectionTitle>Category Breakdown</StatsCategorySectionTitle>
                      <StatsCategoryCard>
                        {['Health', 'Mind', 'Work'].map(cat => {
                          const catHabits = habits.filter(h => h.category === cat);
                          const totalCat = catHabits.length;
                          const completedCat = catHabits.filter(h => h.completions.includes(todayStr)).length;
                          if (totalCat === 0) return null;
                          const pct = Math.round((completedCat / totalCat) * 100);
                          return (
                            <CategoryProgressRow key={cat}>
                              <ProgressLabelInfo>
                                <ProgressText>{cat}</ProgressText>
                                <ProgressVal>{completedCat}/{totalCat} ({pct}%)</ProgressVal>
                              </ProgressLabelInfo>
                              <ProgressBarContainer>
                                <ProgressBarFill percent={pct} color={cat === 'Health' ? '#4ECDC4' : cat === 'Mind' ? '#9B7EDE' : '#FF7E47'} />
                              </ProgressBarContainer>
                            </CategoryProgressRow>
                          );
                        })}
                      </StatsCategoryCard>

                      <StatsCategorySectionTitle>Timeline History</StatsCategorySectionTitle>
                    </>
                  );
                })()}

                {groupedHistory().map((group, groupIdx) => (
                  <TimelineGroup key={groupIdx}>
                    <TimelineGroupTitle>{group.month}</TimelineGroupTitle>
                    {group.data.map((item: any, itemIdx: number) => {
                      const d = new Date(item.dateStr);
                      const formattedDate = `${d.getDate()} ${monthNames[d.getMonth()].substring(0, 3)}`;
                      const isDifferentDate = itemIdx > 0 && group.data[itemIdx - 1].dateStr !== item.dateStr;
                      return (
                        <TimelineRow key={itemIdx} style={isDifferentDate ? { marginTop: 16 } : null}>
                          <TimelineIconBox color={item.color}>
                            {getIconElement(item.icon, '#FFFFFF', 14)}
                          </TimelineIconBox>
                          <TimelineTextCol>
                            <TimelineText color={item.color}>{item.text}</TimelineText>
                            <TimelineHabitName>{item.name}</TimelineHabitName>
                          </TimelineTextCol>
                          <TimelineDate>{formattedDate}</TimelineDate>
                        </TimelineRow>
                      );
                    })}
                  </TimelineGroup>
                ))}

                {groupedHistory().length === 0 && (
                  <EmptyStateContainer>
                    <Sparkles size={40} color="#6B6280" style={{ marginBottom: 12 }} />
                    <EmptyStateText>No history logged yet.</EmptyStateText>
                    <EmptyStateSubtext>Start checking off habits to populate your history log.</EmptyStateSubtext>
                  </EmptyStateContainer>
                )}

                <DetailExtraSpacing />
              </AnalyticsScrollContent>
            </AnalyticsContainer>
          </TouchableWithoutFeedback>
        </ModalBackdrop>
      </Modal>

      {/* Confetti Animation Overlay */}
      {confettiParticles.map((p) => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: p.x,
            width: 8,
            height: 8,
            borderRadius: 2,
            backgroundColor: p.color,
            transform: [
              { translateY: p.y },
              { rotate: p.rotate },
              { scale: p.scale },
            ],
            zIndex: 9999,
          }}
          pointerEvents="none"
        />
      ))}

    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: transparent;
`;

// Suggestions components
const SuggestionsBox = styled.View`
  margin-top: 10px;
  margin-bottom: 24px;
  background-color: rgba(255, 255, 255, 0.02);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  padding: 16px;
`;

const SuggestionsTitle = styled.Text`
  color: #6B6280;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
`;

const SuggestionRow = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 10px 14px;
  margin-bottom: 8px;
`;

const SuggestionLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const SuggestionIconBox = styled.View<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background-color: ${props => props.color};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`;

const SuggestionName = styled.Text`
  color: #FFFFFF;
  font-size: 13px;
  font-weight: bold;
  flex: 1;
`;

const SuggestionCategoryCarousel = styled.ScrollView`
  flex-direction: row;
  margin-top: 12px;
  border-top-width: 1px;
  border-top-color: rgba(255, 255, 255, 0.05);
  padding-top: 12px;
`;

const SuggestionCategoryTab = styled.TouchableOpacity<{ active: boolean }>`
  background-color: ${props => props.active ? 'rgba(255, 126, 71, 0.15)' : 'transparent'};
  padding: 6px 12px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${props => props.active ? '#FF7E47' : 'transparent'};
  margin-right: 8px;
`;

const SuggestionCategoryTabText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FF7E47' : '#6B6280'};
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
`;

// Stats Modal Components
const StatsCardRowGrid = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 20px;
  margin-top: 10px;
`;

const StatsMiniCard = styled.View`
  flex: 0.48;
  background-color: rgba(255, 255, 255, 0.03);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 14px;
`;

const StatsMiniCardTitle = styled.Text`
  color: #6B6280;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
`;

const StatsMiniCardNumber = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 800;
  margin-top: 6px;
`;

const StatsCategorySectionTitle = styled.Text`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  margin-top: 8px;
`;

const StatsCategoryCard = styled.View`
  background-color: rgba(255, 255, 255, 0.03);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 24px;
`;

const CategoryProgressRow = styled.View`
  margin-bottom: 12px;
`;

const ProgressLabelInfo = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const ProgressText = styled.Text`
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 600;
`;

const ProgressVal = styled.Text`
  color: #6B6280;
  font-size: 12px;
  font-weight: bold;
`;

const ProgressBarContainer = styled.View`
  height: 6px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  width: 100%;
  overflow: hidden;
`;

const ProgressBarFill = styled.View<{ percent: number; color: string }>`
  height: 100%;
  width: ${props => props.percent}%;
  background-color: ${props => props.color};
  border-radius: 3px;
`;

const HeaderBar = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 50px 20px 10px 20px;
  height: 100px;
  border-bottom-width: 1px;
  border-bottom-color: #1E1E26;
`;

const HeaderLeftActions = styled.View`
  flex-direction: row;
  align-items: center;
`;

const SettingsButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 16px;
  justify-content: center;
  align-items: center;
`;

const LayoutButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 16px;
  justify-content: center;
  align-items: center;
  margin-left: 8px;
`;

const LogoTextArea = styled.View`
  flex-direction: row;
  align-items: center;
`;

const HeaderTitle = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: bold;
`;

const ProBadge = styled.View`
  border-width: 1px;
  border-color: #FF7E47;
  border-radius: 6px;
  padding: 2px 6px;
  background-color: rgba(255, 126, 71, 0.1);
  margin-left: 8px;
`;

const ProBadgeText = styled.Text`
  color: #FF7E47;
  font-size: 8px;
  font-weight: 800;
`;

const RightActions = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ActionButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 16px;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
`;

const AddCircleButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  background-color: #FF7E47;
  border-radius: 16px;
  justify-content: center;
  align-items: center;
  shadow-color: #FF7E47;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
`;

const ScrollContent = styled.ScrollView`
  flex: 1;
  padding: 20px;
`;

// Habit Kit List Card Component styles (Image 1)
const HabitKitCard = styled(GlassCard)`
  padding: 10px 14px;
  margin-bottom: 8px;
`;

const CardMainRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const CardIconBox = styled.View<{ color: string }>`
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background-color: ${props => props.color};
  justify-content: center;
  align-items: center;
`;

const CardTextColumn = styled.View`
  flex: 1;
  margin-left: 12px;
`;

const HabitTitle = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: bold;
`;

const HabitDescription = styled.Text`
  color: #6B6280;
  font-size: 11px;
  margin-top: 2px;
`;

const CardCheckbox = styled.TouchableOpacity<{ completed: boolean; color: string }>`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border-width: 1.5px;
  border-color: ${props => props.completed ? props.color : '#6B6280'};
  background-color: ${props => props.completed ? props.color : 'transparent'};
  justify-content: center;
  align-items: center;
`;

const CardGridWrapper = styled.View`
  margin-bottom: 6px;
  opacity: 0.85;
`;

const CardFooterStreak = styled.Text<{ color: string }>`
  color: ${props => props.color};
  font-size: 11px;
  font-weight: 600;
  margin-left: 2px;
`;

// Empty view
const EmptyStateContainer = styled.View`
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
`;

const EmptyStateText = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: bold;
`;

const EmptyStateSubtext = styled.Text`
  color: #6B6280;
  font-size: 12px;
  text-align: center;
  margin-top: 4px;
`;

// Layout Switcher (Image 1 Bottom center floating menu)
const LayoutSwitcherContainer = styled.View`
  position: absolute;
  bottom: 90px;
  left: 0;
  right: 0;
  align-items: center;
  justify-content: center;
`;

const SwitcherRow = styled.View`
  flex-direction: row;
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 20px;
  padding: 6px 12px;
  shadow-color: #000;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 5;
`;

const SwitcherPill = styled.TouchableOpacity<{ active: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${props => props.active ? 'rgba(255, 126, 71, 0.12)' : 'transparent'};
  justify-content: center;
  align-items: center;
  margin-horizontal: 4px;
`;

const ExtraSpacing = styled.View`
  height: 80px;
`;

// Modals Common Backdrop
const ModalBackdrop = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.7);
  justify-content: flex-end;
`;

// 1. Habit Detail Bottom-up Modal Style (Image 2)
const DetailContainer = styled.View`
  background-color: #08080A;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  border-width: 1px;
  border-color: #1E1E26;
  padding: 24px;
  max-height: 85%;
`;

const DetailHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const DetailHeaderLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const DetailTextInfo = styled.View`
  margin-left: 12px;
  flex: 1;
`;

const DetailTitle = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: bold;
`;

const DetailDescText = styled.Text`
  color: #6B6280;
  font-size: 12px;
  margin-top: 2px;
`;

const CloseButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  justify-content: center;
  align-items: center;
`;

const DetailInlineGridWrapper = styled.View`
  margin-bottom: 20px;
`;

const DetailActionRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 24px;
`;

const InfoPill = styled.View`
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 12px;
  padding: 6px 12px;
  margin-right: 8px;
`;

const InfoPillText = styled.Text`
  color: #B8B0D0;
  font-size: 11px;
  font-weight: 600;
`;

const RightActionsGroup = styled.View`
  flex-direction: row;
  flex: 1;
  justify-content: flex-end;
`;

const SquareButton = styled.TouchableOpacity`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  justify-content: center;
  align-items: center;
  margin-left: 8px;
`;

const MonthSelectorRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-horizontal: 4px;
`;

const MonthSelectorTitle = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: bold;
`;

const MonthNavigators = styled.View`
  flex-direction: row;
`;

const MonthNavButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  background-color: #111116;
  border-radius: 6px;
  border-width: 1px;
  border-color: #1E1E26;
  justify-content: center;
  align-items: center;
  margin-left: 6px;
`;

// Interactive Monthly Grid layout
const CalendarGrid = styled.View`
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 16px;
  padding: 14px;
`;

const WeekdayRow = styled.View`
  flex-direction: row;
  justify-content: space-around;
  margin-bottom: 10px;
`;

const WeekdayLabel = styled.Text`
  color: #6B6280;
  font-size: 11px;
  font-weight: 800;
  width: 36px;
  text-align: center;
`;

const DaysGridRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
`;

const DayCell = styled.TouchableOpacity`
  width: 14.28%; /* 7 columns */
  height: 40px;
  justify-content: center;
  align-items: center;
  margin-vertical: 2px;
`;

const DayLabelContainer = styled.View<{ completed: boolean; color: string; isToday: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${props => props.completed ? props.color : 'transparent'};
  border-width: ${props => props.isToday ? '1px' : '0px'};
  border-color: #FFFFFF;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const DayNumberText = styled.Text<{ completed: boolean; isToday: boolean }>`
  color: ${props => props.completed ? '#08080A' : '#FFFFFF'};
  font-size: 12px;
  font-weight: ${props => (props.completed || props.isToday) ? '800' : 'normal'};
`;

const UnderDot = styled.View`
  position: absolute;
  bottom: 3px;
  width: 3px;
  height: 3px;
  border-radius: 1.5px;
  background-color: #08080A;
`;

const DetailExtraSpacing = styled.View`
  height: 40px;
`;

// 2. Creator & Editor Modal styling (Image 3 & 4)
const EditorContainer = styled.View`
  background-color: #08080A;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  border-width: 1px;
  border-color: #1E1E26;
  height: 85%;
`;

const EditorHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom-width: 1px;
  border-bottom-color: #1E1E26;
`;

const EditorHeaderTitle = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: bold;
`;

const PlaceholderButton = styled.View`
  width: 36px;
`;

const EditorScrollContent = styled.ScrollView`
  flex: 1;
  padding: 24px;
`;

const PreviewIconContainer = styled.View`
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

const PreviewCircle = styled.View<{ color: string }>`
  width: 70px;
  height: 70px;
  border-radius: 18px;
  background-color: ${props => props.color};
  justify-content: center;
  align-items: center;
  shadow-color: ${props => props.color};
  shadow-opacity: 0.4;
  shadow-radius: 10px;
  elevation: 6;
`;

const IconSelectorCarousel = styled.ScrollView`
  flex-direction: row;
  margin-bottom: 24px;
  padding-bottom: 8px;
`;

const IconOptionCell = styled.TouchableOpacity<{ selected: boolean }>`
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background-color: ${props => props.selected ? 'rgba(255, 126, 71, 0.12)' : '#111116'};
  border-width: 1px;
  border-color: ${props => props.selected ? '#FF7E47' : '#1E1E26'};
  justify-content: center;
  align-items: center;
  margin-right: 8px;
`;

const InputLabel = styled.Text`
  color: #B8B0D0;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 8px;
  margin-left: 2px;
`;

const TextInputBox = styled.TextInput`
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 12px;
  color: #FFFFFF;
  padding: 12px 16px;
  font-size: 14px;
  margin-bottom: 18px;
`;

// Colors selection grid (18 colors in 3 rows)
const ColorsGridContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 22px;
`;

const ColorCircle = styled.TouchableOpacity<{ color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background-color: ${props => props.color};
  margin: 4px;
  justify-content: center;
  align-items: center;
`;

const ColorDotCenter = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background-color: #08080A;
`;

// Advanced panel toggle
const AdvancedToggle = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 12px 2px;
  margin-bottom: 14px;
  border-bottom-width: 1px;
  border-bottom-color: #1E1E26;
`;

const AdvancedToggleText = styled.Text`
  color: #FF7E47;
  font-size: 13px;
  font-weight: bold;
`;

const AdvancedFieldsArea = styled.View`
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 12px;
  padding: 6px 14px;
  margin-bottom: 18px;
`;

const AdvancedFieldRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 10px;
`;

const AdvancedLabel = styled.Text`
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 500;
`;

const AdvancedSelectPill = styled.TouchableOpacity`
  background-color: #1A1A22;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 8px;
  padding: 4px 10px;
`;

const AdvancedSelectText = styled.Text`
  color: #B8B0D0;
  font-size: 12px;
`;

// Completion tracking mode tabs
const TrackingModeRow = styled.View`
  flex-direction: row;
  margin-bottom: 18px;
`;

const TrackingModeTab = styled.TouchableOpacity<{ active: boolean }>`
  flex: 1;
  background-color: ${props => props.active ? 'rgba(255, 126, 71, 0.08)' : '#111116'};
  border-width: 1px;
  border-color: ${props => props.active ? '#FF7E47' : '#1E1E26'};
  border-radius: 12px;
  padding: 12px;
  margin-horizontal: 4px;
`;

const TrackingModeText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FF7E47' : '#FFFFFF'};
  font-size: 13px;
  font-weight: bold;
`;

const TrackingModeSub = styled.Text`
  color: #6B6280;
  font-size: 9px;
  margin-top: 4px;
`;

// Completions stepper styling (Image 4)
const StepperRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 12px;
  padding: 10px 16px;
  margin-bottom: 24px;
`;

const StepperLabelText = styled.Text`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: bold;
`;

const StepperActions = styled.View`
  flex-direction: row;
  align-items: center;
`;

const StepperButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: #1A1A22;
  border-width: 1px;
  border-color: #1E1E26;
  justify-content: center;
  align-items: center;
  margin-left: 8px;
`;

const StepperButtonText = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: bold;
`;

const SaveButton = styled.TouchableOpacity`
  background-color: #FF7E47;
  padding: 14px;
  border-radius: 12px;
  justify-content: center;
  align-items: center;
  shadow-color: #FF7E47;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 5;
`;

const SaveButtonText = styled.Text`
  color: #08080A;
  font-size: 15px;
  font-weight: bold;
`;

const EditorExtraSpacing = styled.View`
  height: 60px;
`;

// List view styled components (Image 2 style)
const RecentDaysHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-horizontal: 4px;
`;

const RecentDaysPill = styled.View`
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 12px;
  padding: 6px 12px;
`;

const RecentDaysPillText = styled.Text`
  color: #B8B0D0;
  font-size: 11px;
  font-weight: 600;
`;

const RecentDaysCols = styled.View`
  flex-direction: row;
  align-items: center;
`;

const RecentDayHeaderCol = styled.View`
  align-items: center;
  justify-content: center;
  width: 32px;
  margin-horizontal: 3px;
`;

const RecentDayHeaderName = styled.Text`
  color: #6B6280;
  font-size: 9px;
  font-weight: bold;
`;

const RecentDayHeaderNum = styled.Text`
  color: #FFFFFF;
  font-size: 11px;
  font-weight: bold;
  margin-top: 1px;
`;

const ListRow = styled(GlassCard)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  margin-bottom: 8px;
`;

const ListTitleBlock = styled.View<{ color: string }>`
  flex-direction: row;
  align-items: center;
  flex: 1;
  background-color: ${props => props.color}15;
  border-width: 1px;
  border-color: ${props => props.color}33;
  border-radius: 12px;
  padding: 8px 12px;
  margin-right: 12px;
`;

const ListIconBox = styled.View<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background-color: ${props => props.color};
  justify-content: center;
  align-items: center;
  margin-right: 8px;
`;

const ListTitle = styled.Text`
  color: #FFFFFF;
  font-size: 13px;
  font-weight: bold;
`;

const ListCheckboxes = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ListCheckboxCell = styled.TouchableOpacity<{ completed: boolean; color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border-width: 1.5px;
  border-color: ${props => props.completed ? props.color : '#252038'};
  background-color: ${props => props.completed ? props.color : '#111116'};
  margin-horizontal: 3px;
  justify-content: center;
  align-items: center;
`;

// Compact view styled components (Image 3 style)
const CompactGridContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
`;

const CompactCard = styled(GlassCard)`
  width: 48.5%;
  padding: 12px;
  margin-bottom: 10px;
`;

const CompactCardHeader = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
  width: 100%;
`;

const CompactCardCheckbox = styled.TouchableOpacity<{ completed: boolean; color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 5px;
  border-width: 1.5px;
  border-color: ${props => props.completed ? props.color : '#6B6280'};
  background-color: ${props => props.completed ? props.color : 'transparent'};
  justify-content: center;
  align-items: center;
  margin-right: 6px;
`;

const CompactCardTitleCol = styled.View`
  flex: 1;
`;

const CompactCardTitle = styled.Text`
  color: #FFFFFF;
  font-size: 11px;
  font-weight: bold;
`;

const CompactCardSub = styled.Text`
  color: #6B6280;
  font-size: 8px;
  margin-top: 1px;
`;

const MiniGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  justify-content: flex-start;
  margin-top: 4px;
`;

const MiniTile = styled.View<{ completed: boolean; isValid: boolean; activeColor: string }>`
  width: 8px;
  height: 8px;
  border-radius: 1.5px;
  margin: 1.5px;
  background-color: ${props => {
    if (props.completed) return props.activeColor;
    if (props.isValid) return '#252038';
    return 'transparent';
  }};
  opacity: ${props => props.completed ? 1.0 : 0.4};
`;

// Analytics / History Backlog styled components (Image 5 style)
const AnalyticsContainer = styled.View`
  background-color: #08080A;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  border-width: 1px;
  border-color: #1E1E26;
  height: 85%;
  padding-top: 12px;
`;

const AnalyticsHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom-width: 1px;
  border-bottom-color: #1E1E26;
`;

const AnalyticsHeaderLeft = styled.View`
  flex-direction: column;
`;

const AnalyticsHeaderRight = styled.View`
  flex-direction: row;
  align-items: center;
`;

const AnalyticsHeaderTitle = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: bold;
`;

const AnalyticsHeaderPercent = styled.Text`
  color: #38EF7D;
  font-size: 13px;
  font-weight: bold;
  margin-right: 12px;
  background-color: rgba(56, 239, 125, 0.1);
  padding: 4px 10px;
  border-radius: 8px;
`;

const AnalyticsScrollContent = styled.ScrollView`
  flex: 1;
  padding: 20px;
`;

const TimelineGroup = styled.View`
  margin-bottom: 24px;
`;

const TimelineGroupTitle = styled.Text`
  color: #FFFFFF;
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const TimelineRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.02);
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
`;

const TimelineIconBox = styled.View<{ color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${props => props.color}20;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`;

const TimelineTextCol = styled.View`
  flex: 1;
`;

const TimelineText = styled.Text<{ color: string }>`
  color: ${props => props.color};
  font-size: 12px;
  font-weight: bold;
`;

const TimelineHabitName = styled.Text`
  color: #6B6280;
  font-size: 10px;
  margin-top: 1px;
`;

const TimelineDate = styled.Text`
  color: #6B6280;
  font-size: 11px;
  font-weight: 600;
`;

const HeaderWrapper = styled.View`
  background-color: transparent;
  width: 100%;
`;

const GestureIndicatorContainer = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
  padding-top: 10px;
  padding-bottom: 5px;
  background-color: transparent;
`;

const GestureIndicatorBar = styled.View`
  width: 40px;
  height: 5px;
  border-radius: 2.5px;
  background-color: rgba(255, 255, 255, 0.2);
`;

// Progress Card Styles
const ProgressCard = styled(GlassCard)`
  padding: 16px 20px;
  margin-bottom: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-width: 1.5px;
  border-color: rgba(78, 205, 196, 0.15);
`;

const ProgressInfo = styled.View`
  flex: 1;
`;

const ProgressTitle = styled.Text`
  color: #6B6280;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ProgressCount = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: bold;
  margin-top: 4px;
`;

const ProgressFeedback = styled.Text`
  color: #38EF7D;
  font-size: 12px;
  margin-top: 6px;
  font-weight: bold;
`;

const ProgressRingContainer = styled.View`
  position: relative;
  width: 60px;
  height: 60px;
  justify-content: center;
  align-items: center;
`;

const ProgressPercentText = styled.Text`
  position: absolute;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: bold;
`;

// Complete button for grid items
const CompleteLongButton = styled.TouchableOpacity<{ completed: boolean; color: string }>`
  background-color: ${props => props.completed ? 'rgba(255, 255, 255, 0.05)' : props.color};
  border-width: 1px;
  border-color: ${props => props.completed ? '#1E1E26' : props.color};
  padding: 8px 12px;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 8px;
  flex-direction: row;
`;

const CompleteLongButtonText = styled.Text<{ completed: boolean }>`
  color: ${props => props.completed ? '#6B6280' : '#08080A'};
  font-size: 13px;
  font-weight: bold;
  margin-left: 6px;
`;

// List Row Redesign Styles
const ListTitleColumn = styled.View`
  flex: 1;
  flex-direction: column;
  justify-content: center;
`;

const ListMetadataRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 4px;
`;

const ListMetadataText = styled.Text`
  color: #6B6280;
  font-size: 10px;
  font-weight: 500;
`;

const ListMetadataSpacing = styled.View`
  width: 12px;
`;

const ListStreakText = styled.Text`
  color: #FF8E53;
  font-size: 10px;
  font-weight: bold;
`;

// Compact Complete Button styles
const CompactCompleteButton = styled.TouchableOpacity<{ completed: boolean; color: string }>`
  background-color: ${props => props.completed ? 'rgba(255, 255, 255, 0.05)' : props.color};
  border-width: 1px;
  border-color: ${props => props.completed ? '#1E1E26' : props.color};
  padding: 6px 8px;
  border-radius: 6px;
  justify-content: center;
  align-items: center;
  margin-top: 8px;
  flex-direction: row;
  width: 100%;
`;

const CompactCompleteButtonText = styled.Text<{ completed: boolean }>`
  color: ${props => props.completed ? '#6B6280' : '#08080A'};
  font-size: 11px;
  font-weight: bold;
  margin-left: 4px;
`;

// Sub Tab Bar Styling
const SubTabBarContainer = styled.View`
  position: absolute;
  bottom: 14px;
  left: 30px;
  right: 30px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
`;

const SubTabButton = styled.TouchableOpacity<{ active: boolean }>`
  flex: 0.44;
  height: 36px;
  background-color: ${props => props.active ? 'rgba(255, 126, 71, 0.22)' : 'rgba(255, 255, 255, 0.03)'};
  border-width: 1px;
  border-color: ${props => props.active ? '#FF7E47' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-opacity: 0.15;
  shadow-radius: 4px;
  shadow-offset: 0px 2px;
  elevation: 2;
`;

const SubTabButtonText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FF8E53' : '#B8B0C5'};
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 0.2px;
`;

const SubTabSpacer = styled.View`
  flex: 0.12;
`;

// Tasks view components
const TasksContainer = styled.View`
  margin-top: 8px;
`;

const TaskRowCard = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.03);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 12px;
  shadow-color: #000;
  shadow-opacity: 0.2;
  shadow-radius: 6px;
  elevation: 3;
`;

const TaskRowLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const TaskCheckboxCircle = styled.TouchableOpacity<{ completed: boolean; color: string }>`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  border-width: 2px;
  border-color: ${props => props.completed ? props.color : 'rgba(255, 255, 255, 0.15)'};
  background-color: ${props => props.completed ? props.color : 'transparent'};
  justify-content: center;
  align-items: center;
  margin-right: 14px;
`;

const TaskTextColumn = styled.View`
  flex: 1;
`;

const TaskTitle = styled.Text<{ completed: boolean }>`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: bold;
  text-decoration-line: ${props => props.completed ? 'line-through' : 'none'};
  opacity: ${props => props.completed ? 0.7 : 1};
`;

const TaskSub = styled.Text`
  color: #6B6280;
  font-size: 11px;
  margin-top: 2px;
`;

const TaskRowRight = styled.View`
  justify-content: center;
  align-items: flex-end;
`;

const TaskStreakText = styled.Text`
  color: #FF8E53;
  font-size: 12px;
  font-weight: bold;
`;

// Popup Styles (Image 5)
const PopupModalBackdrop = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(8, 8, 10, 0.6);
  justify-content: center;
  align-items: center;
`;

const PopupCenterWrapper = styled.View`
  align-items: center;
  justify-content: center;
  width: 100%;
  padding-horizontal: 20px;
`;

const PopupCardContainer = styled.TouchableOpacity`
  background-color: #FFFFFF;
  border-radius: 24px;
  padding: 24px;
  width: 100%;
  max-width: 320px;
  align-items: center;
  position: relative;
  shadow-color: #000;
  shadow-opacity: 0.5;
  shadow-radius: 20px;
  elevation: 10;
`;

const PopupSparkBadge = styled.View`
  position: absolute;
  top: 16px;
  right: 18px;
`;

const PopupContentCenter = styled.View`
  align-items: center;
  margin-top: 12px;
  margin-bottom: 24px;
  width: 100%;
`;

const PopupCircleIcon = styled.View<{ color: string }>`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${props => props.color};
  justify-content: center;
  align-items: center;
  margin-bottom: 12px;
`;

const PopupTaskTitle = styled.Text`
  color: #08080A;
  font-size: 18px;
  font-weight: 800;
  text-align: center;
`;

const PopupFrequencyText = styled.Text`
  color: #6B6280;
  font-size: 12px;
  margin-top: 6px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const PopupActionRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 8px;
`;

const PopupButton = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
  flex: 1;
`;

const PopupActionIconWrapper = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #F5F5FA;
  justify-content: center;
  align-items: center;
  margin-bottom: 6px;
`;

const PopupButtonText = styled.Text`
  color: #6B6280;
  font-size: 11px;
  font-weight: bold;
`;

const PopupCompleteCircleButton = styled.TouchableOpacity<{ completed: boolean }>`
  width: 76px;
  height: 76px;
  border-radius: 38px;
  background-color: ${props => props.completed ? '#F5F5FA' : '#FF7E47'};
  justify-content: center;
  align-items: center;
  margin-horizontal: 10px;
  shadow-color: #FF7E47;
  shadow-opacity: 0.25;
  shadow-radius: 8px;
  elevation: 4;
`;

const PopupCompleteText = styled.Text<{ completed: boolean }>`
  color: ${props => props.completed ? '#6B6280' : '#08080A'};
  font-size: 9px;
  font-weight: 800;
  margin-top: 4px;
  text-transform: uppercase;
`;

const PopupCloseCircle = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.15);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.25);
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;

