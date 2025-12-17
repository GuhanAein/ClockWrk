package com.task.clockwrk.clockWork.services;

import com.task.clockwrk.clockWork.entity.Task;
import com.task.clockwrk.clockWork.entity.User;
import com.task.clockwrk.clockWork.repository.TaskRepository;
import com.task.clockwrk.clockWork.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public List<Task> getAllTasks() {
        return taskRepository.findByUserId(getCurrentUser().getId());
    }

    public Task createTask(Task task) {
        task.setUser(getCurrentUser());
        return taskRepository.save(task);
    }

    public Task updateTask(UUID id, Task updatedTask) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        // Ensure ownership
        if (!task.getUser().getId().equals(getCurrentUser().getId())) {
             throw new RuntimeException("Unauthorized");
        }

        task.setTitle(updatedTask.getTitle());
        task.setDescription(updatedTask.getDescription());
        task.setCompleted(updatedTask.isCompleted());
        task.setDueDate(updatedTask.getDueDate());
        task.setPriority(updatedTask.getPriority());
        task.setListName(updatedTask.getListName());

        return taskRepository.save(task);
    }
    
    public void toggleComplete(UUID id) {
         Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
         if (!task.getUser().getId().equals(getCurrentUser().getId())) {
             throw new RuntimeException("Unauthorized");
        }
        task.setCompleted(!task.isCompleted());
        taskRepository.save(task);
    }

    public void deleteTask(UUID id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        if (!task.getUser().getId().equals(getCurrentUser().getId())) {
             throw new RuntimeException("Unauthorized");
        }
        taskRepository.delete(task);
    }

    private User getCurrentUser() {
        String email = ((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUsername();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
