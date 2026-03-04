package com.skillmentor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;


@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "students")
@Getter
@Setter
@Builder
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id",nullable = false,unique = true)
    private  User user;

    @Column(name = "student_code", nullable = false, unique = true)
    private String studentCode;

    @Column(columnDefinition = "TEXT")
    private String learningGoals;

    @ManyToMany(mappedBy = "students")
    private List<Session> sessions;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
