package com.task.clockwrk.clockWork.repository;

import com.task.clockwrk.clockWork.entity.CustomList;
import com.task.clockwrk.clockWork.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CustomListRepository extends JpaRepository<CustomList, UUID> {
    List<CustomList> findAllByUser(User user);
    void deleteByIdAndUser(UUID id, User user);
}
