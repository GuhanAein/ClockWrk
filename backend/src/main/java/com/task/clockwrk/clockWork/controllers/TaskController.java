package com.task.clockwrk.clockWork.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.task.clockwrk.clockWork.entity.Task;
import com.task.clockwrk.clockWork.services.TaskService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@Valid @RequestBody Task task) {
        return ResponseEntity.ok(taskService.createTask(task));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(
            @PathVariable UUID id, 
            @Valid @RequestBody Task task
    ) {
        return ResponseEntity.ok(taskService.updateTask(id, task));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Void> toggleComplete(@PathVariable UUID id) {
        taskService.toggleComplete(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/calendar")
    public ResponseEntity<List<Task>> getTasksForCalendar(
            @RequestParam String startDate,
            @RequestParam String endDate
    ) {
        return ResponseEntity.ok(taskService.getTasksBetweenDates(startDate, endDate));
    }
    
    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<Task> rescheduleTask(
            @PathVariable UUID id,
            @RequestParam String newStart,
            @RequestParam(required = false) String newEnd
    ) {
        return ResponseEntity.ok(taskService.rescheduleTask(id, newStart, newEnd));
    }
}
