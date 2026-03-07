package com.skillmentor.service;

import com.skillmentor.dto.PagedResponse;
import com.skillmentor.dto.mentor.CreateMentorDTO;
import com.skillmentor.dto.mentor.MentorDTO;
import com.skillmentor.dto.mentor.UpdateMentorDTO;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MentorService {
    List<MentorDTO> getAllMentors();
    PagedResponse<MentorDTO> searchMentors(String name, String profession, Pageable pageable);
    MentorDTO getMentorById(Long id);
    MentorDTO createMentor(CreateMentorDTO dto, String clerkId);
    MentorDTO updateMentor(Long id, UpdateMentorDTO dto);
    void deleteMentor(Long id);
    MentorDTO uploadProfileImage(Long mentorId, MultipartFile file);
}
