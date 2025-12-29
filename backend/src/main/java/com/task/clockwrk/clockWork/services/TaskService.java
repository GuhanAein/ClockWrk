package com.task.clockwrk.clockWork.services;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.task.clockwrk.clockWork.entity.Task;
import com.task.clockwrk.clockWork.entity.User;
import com.task.clockwrk.clockWork.exception.ApiException;
import com.task.clockwrk.clockWork.repository.TaskRepository;
import com.task.clockwrk.clockWork.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public List<Task> getAllTasks() {
        return taskRepository.findByUserId(getCurrentUser().getId());
    }

    @Transactional
    public Task createTask(Task task) {
        User currentUser = getCurrentUser();
        task.setUser(currentUser);
        task.setCreatedAt(Instant.now());
        
        log.info("Creating task '{}' for user {}", task.getTitle(), currentUser.getEmail());
        return taskRepository.save(task);
    }

    @Transactional
    public Task updateTask(UUID id, Task updatedTask) {
        Task task = getTaskWithOwnershipCheck(id);

        task.setTitle(updatedTask.getTitle());
        task.setDescription(updatedTask.getDescription());
        task.setCompleted(updatedTask.isCompleted());
        task.setDueDate(updatedTask.getDueDate());
        task.setPriority(updatedTask.getPriority());
        task.setListName(updatedTask.getListName());
        
        // Update time-based scheduling fields
        task.setStartTime(updatedTask.getStartTime());
        task.setEndTime(updatedTask.getEndTime());
        task.setAllDay(updatedTask.getAllDay());
        task.setDurationMinutes(updatedTask.getDurationMinutes());

        log.info("Updated task '{}'", task.getTitle());
        return taskRepository.save(task);
    }
    
    public List<Task> getTasksBetweenDates(String startDateStr, String endDateStr) {
        LocalDate startDate;
        LocalDate endDate;
        
        try {
            startDate = LocalDate.parse(startDateStr);
            endDate = LocalDate.parse(endDateStr);
        } catch (DateTimeParseException e) {
            throw ApiException.badRequest("Invalid date format. Use YYYY-MM-DD format.");
        }
        
        if (startDate.isAfter(endDate)) {
            throw ApiException.badRequest("Start date must be before or equal to end date");
        }
        
        User user = getCurrentUser();
        
        return taskRepository.findByUserId(user.getId()).stream()
                .filter(task -> {
                    if (task.getDueDate() != null) {
                        return !task.getDueDate().isBefore(startDate) && 
                               !task.getDueDate().isAfter(endDate);
                    }
                    if (task.getStartTime() != null) {
                        LocalDate taskDate = task.getStartTime()
                                .atZone(ZoneId.systemDefault())
                                .toLocalDate();
                        return !taskDate.isBefore(startDate) && 
                               !taskDate.isAfter(endDate);
                    }
                    return false;
                })
                .toList();
    }
    
    @Transactional
    public Task rescheduleTask(UUID id, String newStartStr, String newEndStr) {
        Task task = getTaskWithOwnershipCheck(id);
        
        Instant newStart;
        try {
            newStart = Instant.parse(newStartStr);
        } catch (DateTimeParseException e) {
            throw ApiException.badRequest("Invalid start time format. Use ISO-8601 format.");
        }
        
        task.setStartTime(newStart);
        task.setAllDay(false);
        task.setDueDate(newStart.atZone(ZoneId.systemDefault()).toLocalDate());
        
        if (newEndStr != null && !newEndStr.isEmpty()) {
            try {
                Instant newEnd = Instant.parse(newEndStr);
                
                if (newEnd.isBefore(newStart)) {
                    throw ApiException.badRequest("End time must be after start time");
                }
                
                task.setEndTime(newEnd);
                long durationMinutes = Duration.between(newStart, newEnd).toMinutes();
                task.setDurationMinutes((int) durationMinutes);
            } catch (DateTimeParseException e) {
                throw ApiException.badRequest("Invalid end time format. Use ISO-8601 format.");
            }
        }
        
        log.info("Rescheduled task '{}' to {}", task.getTitle(), newStart);
        return taskRepository.save(task);
    }
    
    @Transactional
    public void toggleComplete(UUID id) {
        Task task = getTaskWithOwnershipCheck(id);
        task.setCompleted(!task.isCompleted());
        taskRepository.save(task);
        log.info("Toggled completion for task '{}': {}", task.getTitle(), task.isCompleted());
    }

    @Transactional
    public void deleteTask(UUID id) {
        Task task = getTaskWithOwnershipCheck(id);
        taskRepository.delete(task);
        log.info("Deleted task '{}'", task.getTitle());
    }

    private Task getTaskWithOwnershipCheck(UUID id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Task not found"));
        
        User currentUser = getCurrentUser();
        if (!task.getUser().getId().equals(currentUser.getId())) {
            throw ApiException.forbidden("You don't have permission to access this task");
        }
        
        return task;
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
