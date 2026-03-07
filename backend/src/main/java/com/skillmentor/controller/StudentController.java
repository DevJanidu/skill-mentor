package com.skillmentor.controller;


import com.skillmentor.dto.session.SessionDTO;
import com.skillmentor.dto.student.CreateStudentDTO;
import com.skillmentor.dto.student.StudentDTO;
import com.skillmentor.dto.student.UpdateStudentDTO;

import com.skillmentor.security.UserPrincipal;
import com.skillmentor.service.SessionService;
import com.skillmentor.service.StudentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;


import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Student Controller")
public class StudentController extends AbstractController {
    private final StudentService studentService;
    private final SessionService sessionService;


    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @GetMapping
    public ResponseEntity<List<StudentDTO>> getAllStudents() {
        return sendOkResponse(studentService.getAllStudents());
    }
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<StudentDTO> getStudentById(@PathVariable Long id) {
        return sendOkResponse(studentService.getStudentById(id));
    }


    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @GetMapping("/{id}/sessions")
    public ResponseEntity<List<SessionDTO>> getSessionsByStudent(@PathVariable Long id) {
        return sendOkResponse(sessionService.getSessionsByStudent(id));
    }



    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<StudentDTO> studentRegistration(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody
            CreateStudentDTO dto) {


        return sendCreatedAtResponse(studentService.createStudent(dto,userPrincipal.getId()));
    }


    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PutMapping("/{id}")
    public ResponseEntity<StudentDTO> updateStudent(
            @PathVariable Long id,
            @Valid @RequestBody
            UpdateStudentDTO dto) {
        return sendOkResponse(studentService.updateStudent(dto,id));
    }


    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return sendOkResponse(String.format("Student deleted with id (%s)", id));
    }

    /**
     * POST /api/students/{id}/profile-image
     * Upload or replace the profile image for a student.
     */
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PostMapping(value = "/{id}/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StudentDTO> uploadProfileImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        return sendOkResponse(studentService.uploadProfileImage(id, file));
    }

    /**
     * POST /api/students/{id}/cover-image
     * Upload or replace the cover/banner image for a student.
     */
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    @PostMapping(value = "/{id}/cover-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StudentDTO> uploadCoverImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        return sendOkResponse(studentService.uploadCoverImage(id, file));
    }

}

