package com.task.clockwrk.clockWork.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitRequest {
    private String name;
    private String description;
    private String category;
    private String frequency;
    private Integer targetCount;
    private String color;
    private String icon;
}
