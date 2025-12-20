package com.task.clockwrk.clockWork.repository;

import com.task.clockwrk.clockWork.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HabitRepository extends JpaRepository<Habit, UUID> {
    List<Habit> findByUserIdAndArchivedFalse(UUID userId);
    List<Habit> findByUserId(UUID userId);
}
