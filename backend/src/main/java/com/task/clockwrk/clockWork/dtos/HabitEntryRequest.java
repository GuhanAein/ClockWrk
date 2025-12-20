package com.task.clockwrk.clockWork.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitEntryRequest {
    private LocalDate date;
    private boolean completed;
    private Integer count;
    private String notes;
}
