package com.task.clockwrk.clockWork.controllers;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
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

import com.task.clockwrk.clockWork.dtos.HabitRequest;
import com.task.clockwrk.clockWork.dtos.HabitResponse;
import com.task.clockwrk.clockWork.entity.HabitEntry;
import com.task.clockwrk.clockWork.services.HabitService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    @GetMapping
    public ResponseEntity<List<HabitResponse>> getAllHabits() {
        return ResponseEntity.ok(habitService.getAllHabits());
    }

    @PostMapping
    public ResponseEntity<HabitResponse> createHabit(@Valid @RequestBody HabitRequest request) {
        return ResponseEntity.ok(habitService.createHabit(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HabitResponse> updateHabit(
            @PathVariable UUID id, 
            @Valid @RequestBody HabitRequest request
    ) {
        return ResponseEntity.ok(habitService.updateHabit(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHabit(@PathVariable UUID id) {
        habitService.deleteHabit(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<Void> archiveHabit(@PathVariable UUID id) {
        habitService.archiveHabit(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<Void> toggleHabitEntry(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        habitService.toggleHabitEntry(id, date);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/entries")
    public ResponseEntity<Map<LocalDate, HabitEntry>> getHabitEntries(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(habitService.getHabitEntries(id, startDate, endDate));
    }

    @GetMapping("/entries")
    public ResponseEntity<Map<UUID, Map<LocalDate, HabitEntry>>> getAllHabitEntries(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(habitService.getAllHabitEntriesForPeriod(startDate, endDate));
    }
}
