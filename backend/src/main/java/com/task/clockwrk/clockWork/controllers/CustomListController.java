package com.task.clockwrk.clockWork.controllers;

import com.task.clockwrk.clockWork.entity.CustomList;
import com.task.clockwrk.clockWork.repository.CustomListRepository;
import com.task.clockwrk.clockWork.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
public class CustomListController {

    private final CustomListRepository listRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<CustomList>> getLists() {
        String email = ((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUsername();
        var user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(listRepository.findAllByUser(user));
    }

    @PostMapping
    public ResponseEntity<CustomList> createList(@RequestBody CustomList listData) {
        String email = ((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUsername();
        var user = userRepository.findByEmail(email).orElseThrow();
        
        var newList = CustomList.builder()
                .name(listData.getName())
                .user(user)
                .build();
                
        return ResponseEntity.ok(listRepository.save(newList));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteList(@PathVariable UUID id) {
        String email = ((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUsername();
        var user = userRepository.findByEmail(email).orElseThrow();
        
        listRepository.deleteByIdAndUser(id, user);
        return ResponseEntity.ok().build();
    }
}
