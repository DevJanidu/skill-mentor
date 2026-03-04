package com.skillmentor.service;

import com.skillmentor.dto.subject.CreateSubjectDTO;
import com.skillmentor.dto.subject.SubjectDTO;
import com.skillmentor.dto.subject.UpdateSubjectDTO;


import java.util.List;

public interface SubjectService {
    List<SubjectDTO> getAllSubjects();
    SubjectDTO getSubjectById(long subjectId);
    SubjectDTO createSubject(Long mentorId, CreateSubjectDTO dto);
    SubjectDTO updateSubject(Long subjectId, UpdateSubjectDTO dto);
    void deleteSubject(Long subjectId);
}
