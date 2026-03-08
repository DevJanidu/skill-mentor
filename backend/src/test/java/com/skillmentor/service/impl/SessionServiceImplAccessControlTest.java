package com.skillmentor.service.impl;

import com.skillmentor.dto.session.SessionDTO;
import com.skillmentor.entity.Mentor;
import com.skillmentor.entity.Session;
import com.skillmentor.entity.Student;
import com.skillmentor.entity.Subject;
import com.skillmentor.entity.User;
import com.skillmentor.exception.SkillMentorException;
import com.skillmentor.repository.MentorRepository;
import com.skillmentor.repository.SessionRepository;
import com.skillmentor.repository.StudentRepository;
import com.skillmentor.repository.SubjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionServiceImplAccessControlTest {

    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private MentorRepository mentorRepository;
    @Mock
    private SubjectRepository subjectRepository;

    @InjectMocks
    private SessionServiceImpl service;

    private Session session;
    private User mentorUser;
    private User studentUser;
    private Mentor mentor;
    private Student student;

    @BeforeEach
    void setUp() {
        mentorUser = User.builder().id(1L).clerkId("clerk_mentor").fullName("Mentor Name").build();
        studentUser = User.builder().id(2L).clerkId("clerk_student").fullName("Student Name").build();

        mentor = Mentor.builder().id(10L).user(mentorUser).build();
        student = Student.builder().id(20L).user(studentUser).build();

        Subject subject = Subject.builder().id(100L).name("Java").mentor(mentor).build();

        session = Session.builder()
                .id(1L)
                .mentor(mentor)
                .subject(subject)
                .students(new ArrayList<>(List.of(student)))
                .sessionAt(new Date())
                .durationMinutes(60)
                .build();
    }

    private void setAuthAs(String role) {
        var auth = new UsernamePasswordAuthenticationToken(
                null, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void getSessionById_adminCanAccessAnySession() {
        setAuthAs("ADMIN");
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        SessionDTO result = service.getSessionById(1L, "clerk_admin");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void getSessionById_mentorOwnerCanAccess() {
        setAuthAs("MENTOR");
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        SessionDTO result = service.getSessionById(1L, "clerk_mentor");

        assertThat(result).isNotNull();
    }

    @Test
    void getSessionById_enrolledStudentCanAccess() {
        setAuthAs("STUDENT");
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        SessionDTO result = service.getSessionById(1L, "clerk_student");

        assertThat(result).isNotNull();
    }

    @Test
    void getSessionById_unenrolledStudentIsForbidden() {
        setAuthAs("STUDENT");
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.getSessionById(1L, "clerk_other_student"))
                .isInstanceOf(SkillMentorException.class)
                .hasMessageContaining("do not have access");
    }

    @Test
    void getSessionById_nonOwnerMentorIsForbidden() {
        setAuthAs("MENTOR");
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.getSessionById(1L, "clerk_other_mentor"))
                .isInstanceOf(SkillMentorException.class)
                .hasMessageContaining("do not have access");
    }

    @Test
    void getSessionById_throwsNotFoundForInvalidId() {
        setAuthAs("STUDENT");
        when(sessionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getSessionById(999L, "clerk_student"))
                .isInstanceOf(SkillMentorException.class)
                .hasMessageContaining("Session not found");
    }
}
