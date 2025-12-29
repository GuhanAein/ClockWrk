package com.task.clockwrk.clockWork.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private boolean completed;

    private LocalDate dueDate;
    
    // Time-based scheduling for calendar view
    @Column(name = "start_time")
    private Instant startTime; // When the task is scheduled to start
    
    @Column(name = "end_time")
    private Instant endTime; // When the task is scheduled to end
    
    @Column(name = "all_day")
    @Builder.Default
    private Boolean allDay = true; // True if task has no specific time
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes; // Estimated duration in minutes

    private int priority; // 0: None, 1: Low, 2: Medium, 3: High

    @Column(name = "list_name")
    private String listName; // e.g., "Inbox", "Work", "Personal"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
