package com.task.clockwrk.clockWork.services;

import com.task.clockwrk.clockWork.dtos.*;
import com.task.clockwrk.clockWork.entity.Habit;
import com.task.clockwrk.clockWork.entity.HabitEntry;
import com.task.clockwrk.clockWork.entity.User;
import com.task.clockwrk.clockWork.repository.HabitEntryRepository;
import com.task.clockwrk.clockWork.repository.HabitRepository;
import com.task.clockwrk.clockWork.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitEntryRepository habitEntryRepository;
    private final UserRepository userRepository;

    public List<HabitResponse> getAllHabits() {
        User user = getCurrentUser();
        List<Habit> habits = habitRepository.findByUserIdAndArchivedFalse(user.getId());
        return habits.stream()
                .map(this::toHabitResponse)
                .collect(Collectors.toList());
    }

    public HabitResponse createHabit(HabitRequest request) {
        User user = getCurrentUser();
        
        Habit habit = Habit.builder()
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .frequency(request.getFrequency())
                .targetCount(request.getTargetCount() != null ? request.getTargetCount() : 1)
                .color(request.getColor())
                .icon(request.getIcon())
                .user(user)
                .build();

        habit = habitRepository.save(habit);
        return toHabitResponse(habit);
    }

    public HabitResponse updateHabit(UUID id, HabitRequest request) {
        Habit habit = habitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Habit not found"));

        if (!habit.getUser().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Unauthorized");
        }

        habit.setName(request.getName());
        habit.setDescription(request.getDescription());
        habit.setCategory(request.getCategory());
        habit.setFrequency(request.getFrequency());
        habit.setTargetCount(request.getTargetCount() != null ? request.getTargetCount() : 1);
        habit.setColor(request.getColor());
        habit.setIcon(request.getIcon());

        habit = habitRepository.save(habit);
        return toHabitResponse(habit);
    }

    public void deleteHabit(UUID id) {
        Habit habit = habitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Habit not found"));

        if (!habit.getUser().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Unauthorized");
        }

        habitRepository.delete(habit);
    }

    public void archiveHabit(UUID id) {
        Habit habit = habitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Habit not found"));

        if (!habit.getUser().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Unauthorized");
        }

        habit.setArchived(true);
        habitRepository.save(habit);
    }

    @Transactional
    public void toggleHabitEntry(UUID habitId, LocalDate date) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new RuntimeException("Habit not found"));

        if (!habit.getUser().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Unauthorized");
        }

        Optional<HabitEntry> existingEntry = habitEntryRepository.findByHabitIdAndDate(habitId, date);

        if (existingEntry.isPresent()) {
            HabitEntry entry = existingEntry.get();
            entry.setCompleted(!entry.isCompleted());
            entry.setCompletedAt(entry.isCompleted() ? Instant.now() : null);
            habitEntryRepository.save(entry);
        } else {
            HabitEntry newEntry = HabitEntry.builder()
                    .habit(habit)
                    .date(date)
                    .completed(true)
                    .completedAt(Instant.now())
                    .count(1)
                    .build();
            habitEntryRepository.save(newEntry);
        }
    }

    public Map<LocalDate, HabitEntry> getHabitEntries(UUID habitId, LocalDate startDate, LocalDate endDate) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new RuntimeException("Habit not found"));

        if (!habit.getUser().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Unauthorized");
        }

        List<HabitEntry> entries = habitEntryRepository.findByHabitIdAndDateBetween(habitId, startDate, endDate);
        return entries.stream()
                .collect(Collectors.toMap(HabitEntry::getDate, entry -> entry));
    }

    public Map<UUID, Map<LocalDate, HabitEntry>> getAllHabitEntriesForPeriod(LocalDate startDate, LocalDate endDate) {
        User user = getCurrentUser();
        List<HabitEntry> entries = habitEntryRepository.findByHabitUserIdAndDateBetween(user.getId(), startDate, endDate);
        
        Map<UUID, Map<LocalDate, HabitEntry>> result = new HashMap<>();
        for (HabitEntry entry : entries) {
            UUID habitId = entry.getHabit().getId();
            result.computeIfAbsent(habitId, k -> new HashMap<>()).put(entry.getDate(), entry);
        }
        
        return result;
    }

    private HabitResponse toHabitResponse(Habit habit) {
        HabitStats stats = calculateStats(habit);
        
        return HabitResponse.builder()
                .id(habit.getId())
                .name(habit.getName())
                .description(habit.getDescription())
                .category(habit.getCategory())
                .frequency(habit.getFrequency())
                .targetCount(habit.getTargetCount())
                .color(habit.getColor())
                .icon(habit.getIcon())
                .archived(habit.isArchived())
                .createdAt(habit.getCreatedAt())
                .stats(stats)
                .build();
    }

    private HabitStats calculateStats(Habit habit) {
        LocalDate today = LocalDate.now();
        LocalDate startOfYear = today.withDayOfYear(1);
        
        List<HabitEntry> allEntries = habitEntryRepository.findByHabitIdAndDateBetween(
                habit.getId(), startOfYear, today);
        
        List<HabitEntry> completedEntries = allEntries.stream()
                .filter(HabitEntry::isCompleted)
                .sorted(Comparator.comparing(HabitEntry::getDate))
                .collect(Collectors.toList());

        // Calculate current streak
        int currentStreak = calculateCurrentStreak(completedEntries, today);
        
        // Calculate longest streak
        int longestStreak = calculateLongestStreak(completedEntries);
        
        // Total completions
        int totalCompletions = completedEntries.size();
        
        // Completion rate
        long daysSinceCreation = ChronoUnit.DAYS.between(habit.getCreatedAt().truncatedTo(ChronoUnit.DAYS), Instant.now().truncatedTo(ChronoUnit.DAYS)) + 1;
        double completionRate = daysSinceCreation > 0 ? (totalCompletions * 100.0 / daysSinceCreation) : 0;
        
        // This week
        LocalDate startOfWeek = today.minusDays(today.getDayOfWeek().getValue() - 1);
        int completionsThisWeek = (int) completedEntries.stream()
                .filter(e -> !e.getDate().isBefore(startOfWeek))
                .count();
        
        // This month
        LocalDate startOfMonth = today.withDayOfMonth(1);
        int completionsThisMonth = (int) completedEntries.stream()
                .filter(e -> !e.getDate().isBefore(startOfMonth))
                .count();

        return HabitStats.builder()
                .currentStreak(currentStreak)
                .longestStreak(longestStreak)
                .totalCompletions(totalCompletions)
                .completionRate(Math.round(completionRate * 100.0) / 100.0)
                .completionsThisWeek(completionsThisWeek)
                .completionsThisMonth(completionsThisMonth)
                .build();
    }

    private int calculateCurrentStreak(List<HabitEntry> completedEntries, LocalDate today) {
        if (completedEntries.isEmpty()) return 0;
        
        int streak = 0;
        LocalDate checkDate = today;
        
        // Check if today or yesterday was completed (allow for grace period)
        boolean foundRecent = completedEntries.stream()
                .anyMatch(e -> e.getDate().equals(today) || e.getDate().equals(today.minusDays(1)));
        
        if (!foundRecent) return 0;
        
        // Start from today and go backwards
        for (int i = 0; i < 365; i++) {
            LocalDate finalCheckDate = checkDate;
            boolean completed = completedEntries.stream()
                    .anyMatch(e -> e.getDate().equals(finalCheckDate));
            
            if (completed) {
                streak++;
                checkDate = checkDate.minusDays(1);
            } else {
                break;
            }
        }
        
        return streak;
    }

    private int calculateLongestStreak(List<HabitEntry> completedEntries) {
        if (completedEntries.isEmpty()) return 0;
        
        int longestStreak = 0;
        int currentStreak = 1;
        
        for (int i = 1; i < completedEntries.size(); i++) {
            LocalDate prevDate = completedEntries.get(i - 1).getDate();
            LocalDate currDate = completedEntries.get(i).getDate();
            
            if (ChronoUnit.DAYS.between(prevDate, currDate) == 1) {
                currentStreak++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
        }
        
        return Math.max(longestStreak, currentStreak);
    }

    private User getCurrentUser() {
        String email = ((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
