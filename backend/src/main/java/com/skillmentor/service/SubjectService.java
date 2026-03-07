package com.skillmentor.service;

import com.skillmentor.dto.PagedResponse;
import com.skillmentor.dto.subject.CreateSubjectDTO;
import com.skillmentor.dto.subject.SubjectDTO;
import com.skillmentor.dto.subject.UpdateSubjectDTO;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface SubjectService {
    List<SubjectDTO> getAllSubjects();
    PagedResponse<SubjectDTO> searchSubjects(String name, String category, Pageable pageable);
    SubjectDTO getSubjectById(long subjectId);
    SubjectDTO createSubject(Long mentorId, CreateSubjectDTO dto);
    SubjectDTO updateSubject(Long subjectId, UpdateSubjectDTO dto);
    void deleteSubject(Long subjectId);

    /** Upload an image to Cloudinary and persist the URL on the subject. */
    SubjectDTO uploadThumbnail(Long subjectId, MultipartFile file);
}
