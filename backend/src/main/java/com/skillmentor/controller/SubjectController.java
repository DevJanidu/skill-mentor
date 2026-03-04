package com.skillmentor.controller;

import com.skillmentor.dto.subject.CreateSubjectDTO;
import com.skillmentor.dto.subject.SubjectDTO;
import com.skillmentor.dto.subject.UpdateSubjectDTO;
import com.skillmentor.service.SubjectService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
@Tag(name = "Subject Controller")
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    public ResponseEntity<List<SubjectDTO>> getALlSubjects(){
        List<SubjectDTO> subjects = subjectService.getAllSubjects();
        return ResponseEntity.ok(subjects);
    }


    @GetMapping("/{id}")
    public ResponseEntity<SubjectDTO> getSubjectById(@PathVariable Long id){
        SubjectDTO subject = subjectService.getSubjectById(id);
        return ResponseEntity.ok(subject);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @PostMapping
    public ResponseEntity<SubjectDTO> createSubject(@Valid @RequestBody CreateSubjectDTO dto){
        SubjectDTO newSubject = subjectService.createSubject(dto.getMentorId(),dto);
        return new ResponseEntity<>(newSubject, HttpStatus.CREATED);
    }
    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @PutMapping("/{id}")
    public ResponseEntity<SubjectDTO> updateSubject(@PathVariable Long id ,
                                                    @Valid  @RequestBody UpdateSubjectDTO dto){
        SubjectDTO updatedSubject = subjectService.updateSubject(id,dto);
        return ResponseEntity.ok(updatedSubject);
    }
    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletedSubject(@PathVariable Long id)
    {
        subjectService.deleteSubject(id);
        return ResponseEntity.ok(String.format("subjected deleted with id (%s)",id));
    }
}

