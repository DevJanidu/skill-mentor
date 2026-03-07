package com.skillmentor.controller;

import com.skillmentor.dto.PagedResponse;
import com.skillmentor.dto.subject.CreateSubjectDTO;
import com.skillmentor.dto.subject.SubjectDTO;
import com.skillmentor.dto.subject.UpdateSubjectDTO;
import com.skillmentor.service.SubjectService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
@Tag(name = "Subject Controller")
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    public ResponseEntity<List<SubjectDTO>> getALlSubjects() {
        List<SubjectDTO> subjects = subjectService.getAllSubjects();
        return ResponseEntity.ok(subjects);
    }

    /**
     * GET /api/subjects/search?name=...&category=...&page=0&size=10&sort=name,asc
     * Paginated search with optional filters.
     */
    @GetMapping("/search")
    public ResponseEntity<PagedResponse<SubjectDTO>> searchSubjects(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            @PageableDefault(size = 10, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(subjectService.searchSubjects(name, category, pageable));
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

    /**
     * POST /api/subjects/{id}/thumbnail
     * Upload or replace the thumbnail image for a subject.
     * Accepts multipart/form-data with a field named "file".
     */
    @PreAuthorize("hasAnyRole('ADMIN','MENTOR')")
    @PostMapping(value = "/{id}/thumbnail", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SubjectDTO> uploadThumbnail(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(subjectService.uploadThumbnail(id, file));
    }
}

