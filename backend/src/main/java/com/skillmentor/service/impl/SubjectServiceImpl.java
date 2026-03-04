package com.skillmentor.service.impl;

import com.skillmentor.dto.subject.CreateSubjectDTO;
import com.skillmentor.dto.subject.SubjectDTO;
import com.skillmentor.dto.subject.UpdateSubjectDTO;
import com.skillmentor.entity.Mentor;
import com.skillmentor.entity.Subject;
import com.skillmentor.exception.SkillMentorException;
import com.skillmentor.mapper.SubjectMapper;
import com.skillmentor.repository.MentorRepository;
import com.skillmentor.repository.SubjectRepository;
import com.skillmentor.service.SubjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;
    private final MentorRepository mentorRepository;

    @Override
    public List<SubjectDTO> getAllSubjects() {
        log.debug("Fetching all subjects");

        return subjectRepository.findAll()
                .stream()
                .map(SubjectMapper::toDTO)
                .toList();
    }

    @Override
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
}
