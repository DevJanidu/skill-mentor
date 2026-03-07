package com.skillmentor.service.impl;

import com.skillmentor.dto.PagedResponse;
import com.skillmentor.dto.subject.CreateSubjectDTO;
import com.skillmentor.dto.subject.SubjectDTO;
import com.skillmentor.dto.subject.UpdateSubjectDTO;
import com.skillmentor.entity.Mentor;
import com.skillmentor.entity.Subject;
import com.skillmentor.exception.SkillMentorException;
import com.skillmentor.mapper.SubjectMapper;
import com.skillmentor.repository.MentorRepository;
import com.skillmentor.repository.SubjectRepository;
import com.skillmentor.service.CloudinaryService;
import com.skillmentor.service.SubjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;
    private final MentorRepository mentorRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    @Transactional(readOnly = true)
    public List<SubjectDTO> getAllSubjects() {
        log.debug("Fetching all subjects");

        return subjectRepository.findAll()
                .stream()
                .map(SubjectMapper::toDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<SubjectDTO> searchSubjects(String name, String category, Pageable pageable) {
        log.debug("Searching subjects — name={}, category={}, page={}", name, category, pageable);

        Page<Subject> page = subjectRepository.searchSubjects(
                name != null && name.isBlank() ? null : name,
                category != null && category.isBlank() ? null : category,
                pageable
        );

        return PagedResponse.<SubjectDTO>builder()
                .content(page.getContent().stream().map(SubjectMapper::toDTO).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectDTO getSubjectById(long subjectId) {
        log.debug("Fetching subject with id {}", subjectId);

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new SkillMentorException(
                        "Subject not found with id " + subjectId,
                        HttpStatus.NOT_FOUND
                ));

        return SubjectMapper.toDTO(subject);
    }

    @Override
    @Transactional
    public SubjectDTO createSubject(Long mentorId, CreateSubjectDTO dto) {
        log.debug("Creating subject for mentor {}", mentorId);

        try {
            Mentor mentor = mentorRepository.findById(mentorId)
                    .orElseThrow(() -> new SkillMentorException(
                            "Mentor not found with id " + mentorId,
                            HttpStatus.NOT_FOUND
                    ));

            Subject subject = SubjectMapper.toEntity(dto);
            subject.setMentor(mentor);

            Subject savedSubject = subjectRepository.save(subject);
            return SubjectMapper.toDTO(savedSubject);

        } catch (SkillMentorException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error creating subject for mentor {}", mentorId, ex);
            throw new SkillMentorException(
                    "Internal server error while creating subject",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Override
    @Transactional
    public SubjectDTO updateSubject(Long subjectId, UpdateSubjectDTO dto) {
        log.debug("Updating subject with id {}", subjectId);

        try {
            Subject subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new SkillMentorException(
                            "Subject not found with id " + subjectId,
                            HttpStatus.NOT_FOUND
                    ));

            Subject updatedSubject = SubjectMapper.UpdateEntity(subject, dto);
            Subject savedSubject = subjectRepository.save(updatedSubject);

            return SubjectMapper.toDTO(savedSubject);

        } catch (SkillMentorException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error updating subject {}", subjectId, ex);
            throw new SkillMentorException(
                    "Internal server error while updating subject",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Override
    @Transactional
    public void deleteSubject(Long subjectId) {
        log.debug("Deleting subject with id {}", subjectId);

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new SkillMentorException(
                        "Subject not found with id " + subjectId,
                        HttpStatus.NOT_FOUND
                ));

        subjectRepository.delete(subject);

        log.info("subject Deleted successfully");
    }

    @Override
    @Transactional
    public SubjectDTO uploadThumbnail(Long subjectId, MultipartFile file) {
        log.debug("Uploading thumbnail for subject {}", subjectId);

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new SkillMentorException(
                        "Subject not found with id " + subjectId, HttpStatus.NOT_FOUND));

        String secureUrl = cloudinaryService.uploadUnsigned(file, "subjects");
        subject.setThumbnailUrl(secureUrl);
        Subject saved = subjectRepository.save(subject);

        log.info("Thumbnail uploaded for subject {} → {}", subjectId, secureUrl);
        return SubjectMapper.toDTO(saved);
    }
}
