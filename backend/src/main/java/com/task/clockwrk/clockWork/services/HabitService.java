package com.task.clockwrk.clockWork.services;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.task.clockwrk.clockWork.dtos.HabitRequest;
import com.task.clockwrk.clockWork.dtos.HabitResponse;
import com.task.clockwrk.clockWork.dtos.HabitStats;
import com.task.clockwrk.clockWork.entity.Habit;
import com.task.clockwrk.clockWork.entity.HabitEntry;
import com.task.clockwrk.clockWork.entity.User;
import com.task.clockwrk.clockWork.exception.ApiException;
import com.task.clockwrk.clockWork.repository.HabitEntryRepository;
import com.task.clockwrk.clockWork.repository.HabitRepository;
import com.task.clockwrk.clockWork.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
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

    @Transactional
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
        log.info("Created habit '{}' for user {}", habit.getName(), user.getEmail());
        return toHabitResponse(habit);
    }

    @Transactional
    public HabitResponse updateHabit(UUID id, HabitRequest request) {
        Habit habit = getHabitWithOwnershipCheck(id);

        habit.setName(request.getName());
        habit.setDescription(request.getDescription());
        habit.setCategory(request.getCategory());
        habit.setFrequency(request.getFrequency());
        habit.setTargetCount(request.getTargetCount() != null ? request.getTargetCount() : 1);
        habit.setColor(request.getColor());
        habit.setIcon(request.getIcon());

        habit = habitRepository.save(habit);
        log.info("Updated habit '{}'", habit.getName());
        return toHabitResponse(habit);
    }

    @Transactional
    public void deleteHabit(UUID id) {
        Habit habit = getHabitWithOwnershipCheck(id);
        habitRepository.delete(habit);
        log.info("Deleted habit '{}'", habit.getName());
    }

    @Transactional
    public void archiveHabit(UUID id) {
        Habit habit = getHabitWithOwnershipCheck(id);
        habit.setArchived(true);
        habitRepository.save(habit);
        log.info("Archived habit '{}'", habit.getName());
    }

    @Transactional
    public void toggleHabitEntry(UUID habitId, LocalDate date) {
        Habit habit = getHabitWithOwnershipCheck(habitId);

        Optional<HabitEntry> existingEntry = habitEntryRepository.findByHabitIdAndDate(habitId, date);

        if (existingEntry.isPresent()) {
            HabitEntry entry = existingEntry.get();
            entry.setCompleted(!entry.isCompleted());
            entry.setCompletedAt(entry.isCompleted() ? Instant.now() : null);
            habitEntryRepository.save(entry);
            log.debug("Toggled habit entry for '{}' on {}: {}", habit.getName(), date, entry.isCompleted());
        } else {
            HabitEntry newEntry = HabitEntry.builder()
                    .habit(habit)
                    .date(date)
                    .completed(true)
                    .completedAt(Instant.now())
                    .count(1)
                    .build();
            habitEntryRepository.save(newEntry);
            log.debug("Created new habit entry for '{}' on {}", habit.getName(), date);
        }
    }

    public Map<LocalDate, HabitEntry> getHabitEntries(UUID habitId, LocalDate startDate, LocalDate endDate) {
        validateDateRange(startDate, endDate);
        Habit habit = getHabitWithOwnershipCheck(habitId);

        List<HabitEntry> entries = habitEntryRepository.findByHabitIdAndDateBetween(habitId, startDate, endDate);
        return entries.stream()
                .collect(Collectors.toMap(HabitEntry::getDate, entry -> entry));
    }

    public Map<UUID, Map<LocalDate, HabitEntry>> getAllHabitEntriesForPeriod(LocalDate startDate, LocalDate endDate) {
        validateDateRange(startDate, endDate);
        User user = getCurrentUser();
        
        List<HabitEntry> entries = habitEntryRepository.findByHabitUserIdAndDateBetween(user.getId(), startDate, endDate);
        
        Map<UUID, Map<LocalDate, HabitEntry>> result = new HashMap<>();
        for (HabitEntry entry : entries) {
            UUID habitId = entry.getHabit().getId();
            result.computeIfAbsent(habitId, k -> new HashMap<>()).put(entry.getDate(), entry);
        }
        
        return result;
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw ApiException.badRequest("Start date must be before or equal to end date");
        }
        
        // Prevent excessively large date ranges
        long daysBetween = ChronoUnit.DAYS.between(startDate, endDate);
        if (daysBetween > 365) {
            throw ApiException.badRequest("Date range cannot exceed 365 days");
        }
    }

    private Habit getHabitWithOwnershipCheck(UUID id) {
        Habit habit = habitRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Habit not found"));

        User currentUser = getCurrentUser();
        if (!habit.getUser().getId().equals(currentUser.getId())) {
            throw ApiException.forbidden("You don't have permission to access this habit");
        }
        
        return habit;
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

        int currentStreak = calculateCurrentStreak(completedEntries, today);
        int longestStreak = calculateLongestStreak(completedEntries);
        int totalCompletions = completedEntries.size();
        
        long daysSinceCreation = ChronoUnit.DAYS.between(
                habit.getCreatedAt().truncatedTo(ChronoUnit.DAYS), 
                Instant.now().truncatedTo(ChronoUnit.DAYS)) + 1;
        double completionRate = daysSinceCreation > 0 ? (totalCompletions * 100.0 / daysSinceCreation) : 0;
        
        LocalDate startOfWeek = today.minusDays(today.getDayOfWeek().getValue() - 1);
        int completionsThisWeek = (int) completedEntries.stream()
                .filter(e -> !e.getDate().isBefore(startOfWeek))
                .count();
        
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
        
        boolean foundRecent = completedEntries.stream()
                .anyMatch(e -> e.getDate().equals(today) || e.getDate().equals(today.minusDays(1)));
        
        if (!foundRecent) return 0;
        
        int streak = 0;
        LocalDate checkDate = today;
        
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
        
        int longestStreak = 1;
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
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        if (!(principal instanceof UserDetails)) {
            throw ApiException.unauthorized("Not authenticated");
        }
        
        String email = ((UserDetails) principal).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }
}
