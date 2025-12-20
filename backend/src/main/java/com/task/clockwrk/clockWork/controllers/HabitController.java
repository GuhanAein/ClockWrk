package com.task.clockwrk.clockWork.controllers;

import com.task.clockwrk.clockWork.dtos.HabitRequest;
import com.task.clockwrk.clockWork.dtos.HabitResponse;
import com.task.clockwrk.clockWork.entity.HabitEntry;
import com.task.clockwrk.clockWork.services.HabitService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
    public ResponseEntity<HabitResponse> createHabit(@RequestBody HabitRequest request) {
        return ResponseEntity.ok(habitService.createHabit(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HabitResponse> updateHabit(@PathVariable UUID id, @RequestBody HabitRequest request) {
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
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        habitService.toggleHabitEntry(id, date);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/entries")
    public ResponseEntity<Map<LocalDate, HabitEntry>> getHabitEntries(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(habitService.getHabitEntries(id, startDate, endDate));
    }

    @GetMapping("/entries")
    public ResponseEntity<Map<UUID, Map<LocalDate, HabitEntry>>> getAllHabitEntries(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(habitService.getAllHabitEntriesForPeriod(startDate, endDate));
    }
}
