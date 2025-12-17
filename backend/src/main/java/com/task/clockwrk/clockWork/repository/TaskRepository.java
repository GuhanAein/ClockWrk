package com.task.clockwrk.clockWork.repository;

import com.task.clockwrk.clockWork.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByUserId(UUID userId);
    List<Task> findByUserIdAndCompleted(UUID userId, boolean completed);
}
