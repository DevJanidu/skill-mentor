package com.skillmentor.service;


import com.skillmentor.dto.student.CreateStudentDTO;
import com.skillmentor.dto.student.StudentDTO;
import com.skillmentor.dto.student.UpdateStudentDTO;


import java.util.List;

public interface StudentService {
    // student crud related

    List<StudentDTO> getAllStudents();
    StudentDTO getStudentById(Long id);
    StudentDTO createStudent(CreateStudentDTO dto,String clerkId);
    StudentDTO updateStudent(UpdateStudentDTO dto, Long id);
    void deleteStudent(Long id);

}


