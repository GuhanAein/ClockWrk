package com.task.clockwrk.clockWork.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "habit_entries", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"habit_id", "date"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitEntry {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habit_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Habit habit;

    @Column(nullable = false)
    private LocalDate date;

    @Builder.Default
    private boolean completed = false;

    private Integer count; // For habits with multiple completions per day

    private String notes; // Optional notes for the day

    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant completedAt;
}
