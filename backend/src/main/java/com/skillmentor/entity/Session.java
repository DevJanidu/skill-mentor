package com.skillmentor.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.skillmentor.dto.session.ReceiptStatus;
import com.skillmentor.dto.session.SessionStatus;
import com.skillmentor.dto.session.SessionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "sessions")
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToMany
    @JoinTable(
            name = "session_students",
            joinColumns = @JoinColumn(name = "session_id"),
            inverseJoinColumns = @JoinColumn(name = "student_id")
    )
    @JsonIgnore
    private List<Student> students = new ArrayList<>();

    @ManyToOne(optional = false)
    @JsonIgnore
    private Mentor mentor;

    @ManyToOne(optional = false)
    @JsonIgnore
    private Subject subject;

    @Enumerated(EnumType.STRING)
    private SessionType sessionType;

    private Integer maxParticipants;

    @Temporal(TemporalType.TIMESTAMP)
    private Date sessionAt;

    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_status", length = 30)
    private SessionStatus sessionStatus;

    private String meetingLink;

    @Column(columnDefinition = "TEXT")
    private String sessionNotes;

    @Column(columnDefinition = "TEXT")
    private String studentReview;

    private Integer studentRating;

    @Column(name = "receipt_url", length = 500)
    private String receiptUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "receipt_status", length = 30)
    @Builder.Default
    private ReceiptStatus receiptStatus = ReceiptStatus.NONE;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "meeting_password", length = 100)
    private String meetingPassword;

    @Column(name = "recording_link", length = 500)
    private String recordingLink;

    @Column(name = "resource_link", length = 500)
    private String resourceLink;

    @Column(name = "assessment_link", length = 500)
    private String assessmentLink;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
