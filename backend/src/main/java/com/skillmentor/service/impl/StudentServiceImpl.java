package com.skillmentor.service.impl;

import com.skillmentor.dto.student.CreateStudentDTO;
import com.skillmentor.dto.student.StudentDTO;
import com.skillmentor.dto.student.UpdateStudentDTO;
import com.skillmentor.entity.Student;
import com.skillmentor.entity.User;
import com.skillmentor.entity.UserRole;
import com.skillmentor.exception.SkillMentorException;
import com.skillmentor.mapper.StudentMapper;
import com.skillmentor.repository.StudentRepository;
import com.skillmentor.service.StudentService;
import com.skillmentor.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final UserService userService;

    @Override
    public List<StudentDTO> getAllStudents() {
        log.debug("Fetching all students");
        List<Student> students = studentRepository.findAll();
        return students.stream()
                .map(StudentMapper::toDTO)
                .toList();
    }

    @Override
    public StudentDTO getStudentById(Long id) {
        log.debug("Fetching student with id {}", id);

        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new SkillMentorException(
                        "Student not found with id " + id,
                        HttpStatus.NOT_FOUND
                ));
        return StudentMapper.toDTO(student);
    }

    @Override
    public StudentDTO createStudent(CreateStudentDTO dto,String clerkId) {
        log.debug("Creating new student with id {}",clerkId);
        try {
            User user = userService.getUserEntityByClerkId(clerkId);
            if(user.getStudent() != null ){
                log.warn("User {} already has a student profile", clerkId);
                throw new SkillMentorException(
                        "User already has a student profile",
                        HttpStatus.CONFLICT
                );
            }

            if (!user.getRoles().contains(UserRole.STUDENT)) {
                log.warn("User {} does not have student role", clerkId);
                throw new SkillMentorException(
                        "User does not have student role. Please complete onboarding first.",
                        HttpStatus.FORBIDDEN
                );
            }

            Student student = StudentMapper.toEntity(dto);
            student.setUser(user);
            Student savedStudent = studentRepository.save(student); // saved new user
            log.info("Student profile created successfully for user: {}", user.getEmail());
            return StudentMapper.toDTO(savedStudent);

        } catch (DataIntegrityViolationException ex) {
            log.warn("Duplicate or invalid student data", ex);
            throw new SkillMentorException(
                    "Email already exists or invalid student data",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    @Override
    public StudentDTO updateStudent(UpdateStudentDTO dto, Long id) {
        log.debug("Updating student with id {}", id);
        try {
            Student student = studentRepository.findById(id)
                    .orElseThrow(() -> new SkillMentorException(
                            "Student not found with id " + id,
                            HttpStatus.NOT_FOUND
                    ));
            Student updatedStudent = StudentMapper.UpdateStudent(student, dto);
            Student savedStudent = studentRepository.save(updatedStudent);
            return StudentMapper.toDTO(savedStudent);  // saved after update
        } catch (SkillMentorException ex) {
            throw ex; // preserve correct status
        } catch (Exception ex) {
            log.error("Unexpected error updating student {}", id, ex);
            throw new SkillMentorException(
                    "Internal server error while updating student",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Override
    public void deleteStudent(Long id) {
        try{
            User user = userService.getUserByStudentId(id);
            log.debug("fetching user with id {}", user.getClerkId());
            log.debug("Deleting student with id {}", id);
            Student student = studentRepository.findById(id)
                    .orElseThrow(() -> new SkillMentorException(
                            "Student not found with id " + id,
                            HttpStatus.NOT_FOUND
                    ));
            studentRepository.delete(student);
            log.debug("Deleting student with id {}", id);
            userService.deleteUser(user.getClerkId());
            log.debug("Deleting user with id {}", user.getClerkId());
        }catch (SkillMentorException e){
            throw  e;
        }catch (Exception e){
            log.error("failed to delete the student: {}",id);
            throw new SkillMentorException("failed to delete the student"
                    ,HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
