package com.task.clockwrk.clockWork.repository;

import com.task.clockwrk.clockWork.entity.HabitEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HabitEntryRepository extends JpaRepository<HabitEntry, UUID> {
    List<HabitEntry> findByHabitIdAndDateBetween(UUID habitId, LocalDate startDate, LocalDate endDate);
    Optional<HabitEntry> findByHabitIdAndDate(UUID habitId, LocalDate date);
    List<HabitEntry> findByHabitUserIdAndDateBetween(UUID userId, LocalDate startDate, LocalDate endDate);
}
