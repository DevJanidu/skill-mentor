package com.skillmentor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String clerkId;  // Clerk user ID (e.g., user_2abc123)

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "first_name")
    private String firstName;
 
    @Column(name = "last_name")
    private String lastName;

    @Column(name = "full_name")
    private String fullName;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    @Builder.Default
    private List<UserRole> roles = new ArrayList<>();

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "onboarding_completed")
    private Boolean onboardingCompleted = false;


    //user relationship with mentor and student
    @OneToOne(mappedBy = "user",cascade = CascadeType.ALL)
    private Mentor mentor;

    @OneToOne(mappedBy = "user",cascade = CascadeType.ALL)
    private Student student;


    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

}
