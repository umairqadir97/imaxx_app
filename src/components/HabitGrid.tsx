import React from 'react';
import styled from 'styled-components/native';
import { ScrollView } from 'react-native';

interface HabitGridProps {
  completions: string[]; // ['2026-07-01', '2026-07-02', ...]
  color: string;
}

export const HabitGrid: React.FC<HabitGridProps> = ({ completions, color }) => {
  // Generate the last 364 days (52 weeks) plus start offset = 53 weeks
  const getGridDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364);
    const dayOfWeek = startDate.getDay();
    const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);

    // Loop through 53 weeks (371 days)
    for (let i = 0; i < 371; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      days.push({
        dateStr,
        isCompleted: completions.includes(dateStr),
        isFuture: date > today,
      });
    }
    return days;
  };

  const gridDays = getGridDays();

  // Chunk days into 53 weeks (columns) of 7 days
  const weeks: any[] = [];
  for (let i = 0; i < 53; i++) {
    weeks.push(gridDays.slice(i * 7, (i + 1) * 7));
  }

  // Calculate Month labels for weeks
  const monthNamesAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabels = weeks.map((week, idx) => {
    const parts = week[0].dateStr.split('-');
    const m = parseInt(parts[1], 10) - 1; // 0-indexed
    const show = idx === 0 || (parseInt(weeks[idx - 1][0].dateStr.split('-')[1], 10) - 1) !== m;
    return {
      name: monthNamesAbbr[m],
      show,
    };
  });

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <GridContainer>
      <WeekRowHeader>
        {weekdays.map((day) => (
          <DayLabel key={day}>{day}</DayLabel>
        ))}
      </WeekRowHeader>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: 10000, y: 0 }}
        style={{ flex: 1 }}
        ref={(ref: any) => {
          if (ref) {
            setTimeout(() => ref.scrollToEnd({ animated: false }), 50);
          }
        }}
      >
        <GridWrapperCol>
          <MonthsRow>
            {monthLabels.map((lbl, idx) => lbl.show ? (
              <MonthText key={idx} leftOffset={idx * 13} numberOfLines={1}>
                {lbl.name}
              </MonthText>
            ) : null)}
          </MonthsRow>
          
          <Grid>
            {weeks.map((week, weekIndex) => (
              <WeekColumn key={`week_${weekIndex}`}>
                {week.map((day: any, dayIndex: number) => (
                  <Tile
                    key={`day_${weekIndex}_${dayIndex}`}
                    completed={day.isCompleted}
                    future={day.isFuture}
                    activeColor={color}
                    accessibilityLabel={`Date ${day.dateStr}, ${day.isCompleted ? 'Completed' : 'Not completed'}`}
                  />
                ))}
              </WeekColumn>
            ))}
          </Grid>
        </GridWrapperCol>
      </ScrollView>

      <WeekRowHeader style={{ marginLeft: 8, marginRight: 0 }}>
        {weekdays.map((day) => (
          <DayLabel key={day} style={{ textAlign: 'left' }}>{day}</DayLabel>
        ))}
      </WeekRowHeader>
    </GridContainer>
  );
};

const GridContainer = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 4px 0;
  width: 100%;
`;

const WeekRowHeader = styled.View`
  flex-direction: column;
  justify-content: space-between;
  margin-right: 8px;
  height: 87px;
  margin-top: 16px;
  align-items: flex-end;
`;

const DayLabel = styled.Text`
  color: #6B6280;
  font-size: 8px;
  font-weight: bold;
  height: 9px;
  line-height: 9px;
  width: 22px;
  text-align: right;
`;

const ScrollWrapper = styled.ScrollView`
  flex: 1;
`;

const GridWrapperCol = styled.View`
  flex-direction: column;
  position: relative;
`;

const MonthsRow = styled.View`
  height: 16px;
  margin-bottom: 4px;
  position: relative;
  width: 100%;
`;

const MonthText = styled.Text<{ leftOffset: number }>`
  font-size: 8px;
  color: #6B6280;
  font-weight: bold;
  position: absolute;
  left: ${props => props.leftOffset}px;
  top: 0;
  width: 35px;
`;

const Grid = styled.View`
  flex-direction: row;
  height: 87px;
  justify-content: flex-start;
`;

const WeekColumn = styled.View`
  flex-direction: column;
  justify-content: space-between;
  margin-right: 4px;
  width: 9px;
`;

const Tile = styled.View<{ completed: boolean; future: boolean; activeColor: string }>`
  width: 9px;
  height: 9px;
  border-radius: 1.5px;
  background-color: ${props => {
    if (props.future) return 'rgba(255, 255, 255, 0.02)';
    if (props.completed) return props.activeColor;
    return '#252038'; // Dark tile
  }};
  opacity: ${props => props.completed ? 1.0 : 0.6};
`;

