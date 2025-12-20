package com.task.clockwrk.clockWork.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitResponse {
    private UUID id;
    private String name;
    private String description;
    private String category;
    private String frequency;
    private Integer targetCount;
    private String color;
    private String icon;
    private boolean archived;
    private Instant createdAt;
    private HabitStats stats;
}
