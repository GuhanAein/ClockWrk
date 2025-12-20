package com.task.clockwrk.clockWork.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitStats {
    private int currentStreak;
    private int longestStreak;
    private int totalCompletions;
    private double completionRate; // Percentage
    private int completionsThisWeek;
    private int completionsThisMonth;
}
