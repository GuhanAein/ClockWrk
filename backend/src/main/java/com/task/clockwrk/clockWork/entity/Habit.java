package com.task.clockwrk.clockWork.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "habits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Habit {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category; // e.g., "Health", "Productivity", "Learning"

    private String frequency; // "daily", "weekly", "custom"

    private int targetCount; // Target completions per period

    private String color; // Hex color for UI

    private String icon; // Icon identifier

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @Builder.Default
    private boolean archived = false;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
