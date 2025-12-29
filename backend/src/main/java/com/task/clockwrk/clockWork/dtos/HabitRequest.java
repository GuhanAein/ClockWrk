package com.task.clockwrk.clockWork.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HabitRequest {
    
    @NotBlank(message = "Habit name is required")
    @Size(max = 100, message = "Habit name must not exceed 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @Size(max = 50, message = "Category must not exceed 50 characters")
    private String category;
    
    @Size(max = 20, message = "Frequency must not exceed 20 characters")
    private String frequency;
    
    @Min(value = 1, message = "Target count must be at least 1")
    @Max(value = 100, message = "Target count must not exceed 100")
    private Integer targetCount;
    
    @Size(max = 20, message = "Color must not exceed 20 characters")
    private String color;
    
    @Size(max = 50, message = "Icon must not exceed 50 characters")
    private String icon;
}
